# DNS snapshot — fantomworks.com

Captured 2026-08-05, immediately before delegation moved from Bluehost's shared
cluster to the VPS nameservers. Keep this to diff against after the cutover.
Enumerated by querying each known name directly; zone transfer (AXFR) is refused.
See `07-dns-control-and-post-cutover.md` for context.

## A. Shared cluster — `ns1.hostmonster.com` (authoritative BEFORE cutover)

```
SOA serial: 2025040500
NS:         ns1.hostmonster.com. ns2.hostmonster.com. 

@                          A      162.144.141.151
@                          A      107.154.148.35
@                          A      107.154.146.35
@                          TXT    "google-site-verification=PbKThdbebP145ONeC_Tn1DkgzbVNNdmJasJ7BzcsjHE"
@                          TXT    "_globalsign-domain-verification=hvcjJPATJhDBEw0VSFYfvIGEHCpY4djt51rrJQglFA"
@                          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com include:hotmail.com ip4:162.144.141.151 ?all"
@                          MX     10 639049430.pamx1.hotmail.com.
localhost                  A      127.0.0.1
www                        CNAME  lwlenk5.sitelockcdn.net.
ftp                        A      162.144.141.151
mail                       A      162.144.141.151
mail                       TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.mail                   A      162.144.141.151
woundedwheels              A      162.144.141.151
woundedwheels              TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels          A      162.144.141.151
woundedwheels-net          A      162.144.141.151
woundedwheels-net          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-net      A      162.144.141.151
woundedwheels-org          A      162.144.141.151
woundedwheels-org          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-org      A      162.144.141.151
woundedwheels-us           A      162.144.141.151
woundedwheels-us           TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-us       A      162.144.141.151
autoconfig                 A      162.144.141.151
autodiscover               A      162.144.141.151
server                     A      162.144.141.151
server                     TXT    "v=spf1 a mx ip4:162.144.141.151 ~all"
ns1                        A      162.144.141.151
ns2                        A      162.144.141.151
projects                   A      162.144.141.151
www.projects               A      162.144.141.151
calls                      A      162.144.141.151
www.calls                  A      162.144.141.151
filming                    A      162.144.141.151
www.filming                A      162.144.141.151
customers                  A      162.144.141.151
www.customers              A      162.144.141.151
65corvette                 A      162.144.141.151
www.65corvette             A      162.144.141.151
71jimmy                    A      162.144.141.151
www.71jimmy                A      162.144.141.151
_dmarc                     TXT    "v=DMARC1; p=none; rua=mailto:2e264e00@mxtoolbox.dmarc-report.com; ruf=mailto:2e264e00@forensics.dmarc-report.com; fo=1"
_domainkey                 TXT    "o=~"
default._domainkey         TXT    "k=rsa; p=MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhAMbD+eYcCyFLs20lX2NT+o1qUVKbPzXVou6Zatx05PVNmewvJCwTKc/tfO2pShPvMljOw1k1UpNC/jxUFRYp/I03T5GMUhu2f1VKyGwNos79K1akmpFMLH0AGVQdgOUPAQIDAQAB"
skj._domainkey             CNAME  dkim1.bead36eacb20.p835.email.myshopify.com.
skj2._domainkey            CNAME  dkim2.bead36eacb20.p835.email.myshopify.com.
skj3._domainkey            CNAME  dkim3.bead36eacb20.p835.email.myshopify.com.
mailerskj                  CNAME  bead36eacb20.p835.email.myshopify.com.
_cpanel-dcv-test-record    TXT    "_cpanel-dcv-test-record=oD8sVZpri8puMibxuCeOOdEp91xpaNZDQiRPRFbY38C3OLYw0Dnn2i83NWaPNIAq"
_autodiscover._tcp         SRV    0 0 443 autodiscover.hostmonster.com.
```

## B. VPS — `162.144.141.151` / `server.fantomworks.com` (authoritative AFTER cutover)

```
SOA serial: 2026080604
NS:         ns2.hostmonster.com. ns1.hostmonster.com. 

@                          A      107.154.146.35
@                          A      107.154.148.35
@                          A      162.144.141.151
@                          TXT    "_globalsign-domain-verification=hvcjJPATJhDBEw0VSFYfvIGEHCpY4djt51rrJQglFA"
@                          TXT    "google-site-verification=PbKThdbebP145ONeC_Tn1DkgzbVNNdmJasJ7BzcsjHE"
@                          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com include:hotmail.com ip4:162.144.141.151 ?all"
@                          MX     10 639049430.pamx1.hotmail.com.
localhost                  A      127.0.0.1
www                        CNAME  lwlenk5.sitelockcdn.net.
ftp                        A      162.144.141.151
mail                       A      162.144.141.151
mail                       TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.mail                   A      162.144.141.151
woundedwheels              A      162.144.141.151
woundedwheels              TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels          A      162.144.141.151
woundedwheels-net          A      162.144.141.151
woundedwheels-net          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-net      A      162.144.141.151
woundedwheels-org          A      162.144.141.151
woundedwheels-org          TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-org      A      162.144.141.151
woundedwheels-us           A      162.144.141.151
woundedwheels-us           TXT    "v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com ip4:162.144.141.151 ?all"
www.woundedwheels-us       A      162.144.141.151
autoconfig                 A      162.144.141.151
autodiscover               A      162.144.141.151
server                     A      162.144.141.151
server                     MX     0 server.fantomworks.com.
ns1                        A      162.144.141.151
ns2                        A      162.144.141.151
projects                   A      162.144.141.151
www.projects               A      162.144.141.151
calls                      A      162.144.141.151
www.calls                  A      162.144.141.151
filming                    A      162.144.141.151
www.filming                A      162.144.141.151
customers                  A      162.144.141.151
www.customers              A      162.144.141.151
65corvette                 A      162.144.141.151
www.65corvette             A      162.144.141.151
71jimmy                    A      162.144.141.151
www.71jimmy                A      162.144.141.151
submit                     CNAME  cname.vercel-dns.com.
log                        CNAME  cname.vercel-dns.com.
send                       TXT    "v=spf1 include:amazonses.com ~all"
send                       MX     10 feedback-smtp.us-east-1.amazonses.com.
_dmarc                     TXT    "v=DMARC1; p=none"
_domainkey                 TXT    "o=~"
default._domainkey         TXT    "k=rsa; p=MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhAMbD+eYcCyFLs20lX2NT+o1qUVKbPzXVou6Zatx05PVNmewvJCwTKc/tfO2pShPvMljOw1k1UpNC/jxUFRYp/I03T5GMUhu2f1VKyGwNos79K1akmpFMLH0AGVQdgOUPAQIDAQAB"
resend._domainkey          TXT    "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDmMijaLYys3LvG805Wlr8/Y3aXo2VTpbsNv9cMdoWn8TOWdcje21rqnWdg6f1x0eU3vAVr8np3Gd0K55oMqV5FO5qMAF5FUmLKOBWIGUA8QAE/6JQpDO2IPiLHWkzbcGiSwaaPtsM7UeRWcg+GstY4VCadF1IRDN8hM94aMnRZkwIDAQAB"
skj._domainkey             CNAME  dkim1.bead36eacb20.p835.email.myshopify.com.
skj2._domainkey            CNAME  dkim2.bead36eacb20.p835.email.myshopify.com.
skj3._domainkey            CNAME  dkim3.bead36eacb20.p835.email.myshopify.com.
mailerskj                  CNAME  bead36eacb20.p835.email.myshopify.com.
_cpanel-dcv-test-record    TXT    "_cpanel-dcv-test-record=_PhbJ6c5ESZzcmjiEFFyy68NZ0w39CSmP7tSwmzjOabe2g_6XUqo0JTJAGtwB31A"
_autodiscover._tcp         SRV    0 0 443 autodiscover.hostmonster.com.
```
