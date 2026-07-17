'use client'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { UPLOADS_BASE, isImageFile } from '@/lib/images'

// Thumbnails that open an in-app lightbox with prev/next arrows — no leaving the site.
export function ImageGallery({ images, customer }: { images: string[]; customer: string }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(0)

  if (images.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {images.map((img, i) => {
          const url = UPLOADS_BASE + img
          return (
            <button
              key={img}
              type="button"
              onClick={() => {
                setStart(i)
                setOpen(true)
              }}
              className="group relative h-14 w-14 overflow-hidden rounded-md ring-1 ring-stone-200 transition hover:ring-stone-400"
              title={`View photo ${i + 1} of ${images.length}`}
            >
              {isImageFile(img) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-stone-100 text-[10px] font-medium text-stone-500">
                  <FileText className="mb-0.5 h-4 w-4" />
                  {img.split('.').pop()?.toUpperCase()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-stone-200 bg-white">
          <DialogTitle className="text-stone-800">{customer} — photos</DialogTitle>
          <DialogDescription className="sr-only">
            Submitted photos. Use the arrows to move between images.
          </DialogDescription>
          <Carousel opts={{ startIndex: start, loop: true }} className="w-full">
            <CarouselContent>
              {images.map((img, i) => {
                const url = UPLOADS_BASE + img
                return (
                  <CarouselItem key={img} className="flex flex-col items-center justify-center">
                    {isImageFile(img) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="max-h-[70vh] w-auto rounded-md object-contain"
                      />
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-64 w-full place-items-center rounded-md bg-stone-100 text-stone-600"
                      >
                        <FileText className="mb-2 h-10 w-10" />
                        Open {img}
                      </a>
                    )}
                    <span className="mt-2 text-xs text-stone-400">
                      {i + 1} of {images.length}
                    </span>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  )
}
