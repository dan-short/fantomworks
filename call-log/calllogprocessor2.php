<?php
session_start();
/* Attempt MySQL server connection. Assuming you are running MySQL
server with default setting (user 'root' with no password) */
$db_host = 'localhost';
$db_user = 'fantomwo_calllog';
$db_pwd = 'REDACTED_SEE_exports/legacy-db-credentials.local.txt';
$database = 'fantomwo_call_log';
$table = 'Project_Submissions';
$table2 = 'Project_Desc';

$mysqli = mysqli_connect($db_host, $db_user, $db_pwd, $database);
if (mysqli_connect_errno()){
    die("Can't connect to database!");
}
    
header( "refresh:2;url=http://www.fantomworks.com/" );
// Escape user inputs for security
//SITELOCK XSS FILTERING CODE
 foreach (array('firstName', 'lastName', 'phoneNumber', 'altPhone', 'callSchedule', 'email', 'city', 'stateCountry', 'zipcode', 'timeZone', 'year', 'make', 'model', 'projectStart', 'projectDescription', 'projectOutline11', 'projectHours', 'projectParts') as $vuln) {
 isset($_POST[$vuln]) and $_POST[$vuln] = htmlentities($_POST[$vuln]);
}

// this just preserves the new lines and what not that people enter so it appears like a formatted list on the call log
if (isset($_POST['projectOutline1'])) {
    // Convert literal \r\n back to actual line breaks
    $_POST['projectOutline1'] = str_replace(['\r\n', '\n', '\r'], ["\r\n", "\n", "\r"], $_POST['projectOutline1']);
    $_POST['projectOutline1'] = mysqli_real_escape_string($mysqli, $_POST['projectOutline1']);
}
//END SITELOCK FILTERING CODE
$_SESSION['firstName'] = $_POST['firstName'];
$_SESSION['lastName'] = $_POST['lastName'];
$_SESSION['phoneNumber'] = $_POST['phoneNumber'];
$_SESSION['altPhone'] = $_POST['altPhone'];
$_SESSION['callSchedule'] = $_POST['callSchedule'];
$_SESSION['email'] = $_POST['email'];
$_SESSION['city'] = $_POST['city'];
$_SESSION['stateCountry'] = $_POST['stateCountry'];
$_SESSION['zipcode'] = $_POST['zipcode'];
$_SESSION['timeZone'] = $_POST['timeZone'];
$_SESSION['year'] = $_POST['year'];
$_SESSION['make'] = $_POST['make'];
$_SESSION['model'] = $_POST['model'];
$_SESSION['projectStart'] = $_POST['projectStart'];
$_SESSION['projectDescription'] = $_POST['projectDescription'];
$_SESSION['projectOutline1'] = $_POST['projectOutline1'];
$_SESSION['projectOutline11'] = $_POST['projectOutline11'];
$_SESSION['projectHours'] = $_POST['projectHours'];
$_SESSION['projectParts'] = $_POST['projectParts'];

$first_name = mysqli_real_escape_string($mysqli, $_SESSION['firstName']);
$last_name =  mysqli_real_escape_string($mysqli, $_SESSION['lastName']);
$phone_number =  mysqli_real_escape_string($mysqli, $_SESSION['phoneNumber']); 
$phone_number = preg_replace('/[^0-9]+/', '', $phone_number);
$phone_number = preg_replace("/([0-9]{3})([0-9]{3})([0-9]{4})/", "($1) $2-$3", $phone_number);
$call_schedule = mysqli_real_escape_string($mysqli, $_SESSION['callSchedule']);
$zipcode =  mysqli_real_escape_string($mysqli, $_SESSION['zipcode']);
$city =  mysqli_real_escape_string($mysqli, $_SESSION['city']);
$state_or_country =  mysqli_real_escape_string($mysqli, $_SESSION['stateCountry']);
$time_zone =  mysqli_real_escape_string($mysqli, $_SESSION['timeZone']);
$email =  mysqli_real_escape_string($mysqli, $_SESSION['email']);
$alt_phone =  mysqli_real_escape_string($mysqli, $_SESSION['altPhone']);
$alt_phone_number = preg_replace('/[^0-9]+/', '', $alt_phone_number);
$alt_phone_number = preg_replace("/([0-9]{3})([0-9]{3})([0-9]{4})/", "($1) $2-$3", $alt_phone_number);
$year =  mysqli_real_escape_string($mysqli, $_SESSION['year']);
$make =  mysqli_real_escape_string($mysqli, $_SESSION['make']);
$model =  mysqli_real_escape_string($mysqli, $_SESSION['model']);
//$budget = mysqli_real_escape_string($mysqli, $_SESSION['TotEst']);
$project_start =  mysqli_real_escape_string($mysqli, $_SESSION['projectStart']);
$project_description =  mysqli_real_escape_string($mysqli, $_SESSION['projectDescription']);
$project_outline1 = mysqli_real_escape_string($mysqli, $_SESSION['projectOutline1']);
$project_outline11 = mysqli_real_escape_string($mysqli, $_SESSION['projectOutline11']);
$project_hours = mysqli_real_escape_string($mysqli, $_SESSION['projectHours']);
$project_parts = mysqli_real_escape_string($mysqli, $_SESSION['projectParts']);


$result = mysqli_query($mysqli, "SHOW TABLE STATUS LIKE 'Project_Submissions'");
$row = mysqli_fetch_array($result, MYSQLI_NUM);
$nextId = $row['Auto_increment']; 


$user = 'Online Form';


	$point1_zip = 23517;
	$point2_zip = $zipcode;
	
	

	$point1_query = "SELECT * FROM ZipCodes WHERE Zip_Code=$point1_zip";
	$point2_query = "SELECT * FROM ZipCodes WHERE Zip_Code=$point2_zip";

	$point1_array_result = mysqli_query($mysqli, $point1_query);
	$point2_array_result = mysqli_query($mysqli, $point2_query);
	
if(!$point2_array_result){
	$point2['Latitude'] = 36.8695;
	$point2['Longitude'] = -76.2945;
} else {
	$point1 = mysqli_fetch_array($point1_array_result, MYSQLI_ASSOC);
	$point2 = mysqli_fetch_array($point2_array_result, MYSQLI_ASSOC);
}
	$radius      = 3958;      // Earth's radius (miles)
    $deg_per_rad = 57.29578;  // Number of degrees/radian (for conversion)

    $distance = ($radius * pi() * sqrt(
                ($point1['Latitude'] - $point2['Latitude'])
                * ($point1['Latitude'] - $point2['Latitude'])
                + cos($point1['Latitude'] / $deg_per_rad)  // Convert these to
                * cos($point2['Latitude'] / $deg_per_rad)  // radians for cos()
                * ($point1['Longitude'] - $point2['Longitude'])
                * ($point1['Longitude'] - $point2['Longitude'])
        ) / 180);

    //return $distance;  // Returned using the units used for $radius.
	

	 $distance = floor($distance);
	




// attempt insert query execution
$sql = ("INSERT INTO Project_Submissions (First_Name, Last_Name, Phone, Distance, ZipCode, City, State_Country, Time_Zone, Email, Alt_Phone, Year, Make, Model, Project_Start, Project_Description, Added_By, Received_Date, CallSchedule, Notes) 
VALUES ('$first_name', '$last_name', '$phone_number', '$distance', '$zipcode', '$city', '$state_or_country', '$time_zone', '$email', '$alt_phone', '$year', '$make', '$model', '$project_start', '$project_description', '$user', CURDATE(),'$call_schedule', ' ')");

$flag_inserted = FALSE;
$flag_inserted = mysqli_query($mysqli, $sql);
$submitted_id = mysqli_insert_id($mysqli);
$target_dir = "uploads/";

$temp_1 = explode(".",$_FILES["fileToUpload_1"]["name"]);
$newfilename_1 = $submitted_id . '_1.' .end($temp_1);

$temp_2 = explode(".",$_FILES['fileToUpload_2']["name"]);
$newfilename_2 = $submitted_id . '_2.' .end($temp_2);

$temp_3 = explode(".",$_FILES['fileToUpload_3']["name"]);
$newfilename_3 = $submitted_id . '_3.' .end($temp_3);

$temp_4 = explode(".",$_FILES['fileToUpload_4']["name"]);
$newfilename_4 = $submitted_id . '_4.' .end($temp_4);


$target_file_1 = $target_dir . $newfilename_1;
$target_file_2 = $target_dir . $newfilename_2;
$target_file_3 = $target_dir . $newfilename_3;
$target_file_4 = $target_dir . $newfilename_4;

$uploadOk = 1;
$imageFileType_1 = pathinfo($target_file_1,PATHINFO_EXTENSION);
$imageFileType_2 = pathinfo($target_file_2,PATHINFO_EXTENSION);
$imageFileType_3 = pathinfo($target_file_3,PATHINFO_EXTENSION);
$imageFileType_4 = pathinfo($target_file_4,PATHINFO_EXTENSION);
// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
    $check_1 = getimagesize($_FILES["fileToUpload_1"]["tmp_name"]);
	$check_2 = getimagesize($_FILES['fileToUpload_2']["tmp_name"]);
	$check_3 = getimagesize($_FILES['fileToUpload_3']["tmp_name"]);
	$check_4 = getimagesize($_FILES['fileToUpload_4']["tmp_name"]);
    if(($check_1 ||$check_2 || $check_3 || $check_4) !== false) {
        echo "File is an image - " . $check["mime"] . ".";
        $uploadOk = 1;
    } else {
        echo "File is not an image.";
        $uploadOk = 0;
    }
}
// Check file size
if (($_FILES["fileToUpload_1"]["size"] || $_FILES['fileToUpload_2']["size"] || $_FILES['fileToUpload_3']["size"] || $_FILES['fileToUpload_4']["size"]) > 500000) {
    echo "Sorry, one of your files is larger than 50MB.";
    $uploadOk = 0;
}
if (!empty($_FILES["fileToUpload_1"]['tmp_name']))
{
    move_uploaded_file($_FILES["fileToUpload_1"]["tmp_name"], $target_file_1);
	
	$fileupload_1 = ("UPDATE Project_Submissions SET ImageName_1 = '$newfilename_1' WHERE ID = '$submitted_id'");
    mysqli_query($mysqli, $fileupload_1);
}

if (!empty($_FILES['fileToUpload_2']['tmp_name']))
{
    move_uploaded_file($_FILES['fileToUpload_2']["tmp_name"], $target_file_2);
	
	$fileupload_2 = ("UPDATE Project_Submissions SET ImageName_2 = '$newfilename_2' WHERE ID = '$submitted_id'");
    mysqli_query($mysqli, $fileupload_2);
}

if (!empty($_FILES['fileToUpload_3']['tmp_name']))
{
    move_uploaded_file($_FILES['fileToUpload_3']["tmp_name"], $target_file_3);
	
	$fileupload_3 = ("UPDATE Project_Submissions SET ImageName_3 = '$newfilename_3' WHERE ID = '$submitted_id'");
    mysqli_query($mysqli, $fileupload_3);
}

if (!empty($_FILES['fileToUpload_4']['tmp_name']))
{
    move_uploaded_file($_FILES['fileToUpload_4']["tmp_name"], $target_file_4);
	
	$fileupload_4 = ("UPDATE Project_Submissions SET ImageName_4 = '$newfilename_4' WHERE ID = '$submitted_id'");
    mysqli_query($mysqli, $fileupload_4);
}
// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} 


if ($flag_inserted)
{
	$sql2 = ("INSERT INTO Project_Desc (ID, DisDesc, IntDesc, ExtDesc, WringDesc) 
VALUES ('$submitted_id', '$project_outline1', '$project_outline11', '$project_hours', '$project_parts')");
	$flag_inserted = mysqli_query($mysqli, $sql2);
}



$check = mysqli_query($mysqli, "SELECT * FROM Project_Submissions WHERE ID=$submitted_id");

$checkrow = mysqli_fetch_array($check, MYSQLI_BOTH);


$datacheck=$checkrow['First_Name'];

if ($datacheck != '')
{
    $email_from = 'fwmail@fantomworks.com';//<== update the email address
    $email_replyto = 'webmaster@fantomworks.com';
    $email_subject = "FantomWorks";
    $email_body = "$first_name,\n".
        "Thank you for your project submission.  You have been added to the call log. If you have submitted a reasonable project with reasonable expectations; you should expect a return call typically within 2-4 weeks from Dan Short as quickly as he can review the submissions and reach out. He is the sole reviewer and receives overwhelming requests.\n 
If you do not receive a response to your submission within four weeks (and you have accurately followed the guidelines of the project estimating tool) please call the shop during normal business hours (757 216-1745) and inquire about your project.\n 
If you submitted a project with an unrealistic budget (based on the budget estimating tool) or you are requesting work that doesn’t fit our shop (because of year/make/model), then you will receive a generic email stating we cannot take on your project. If you submit a project with an insulting budget, then the submission will be deleted and you will not receive a response.\n 
Dan sometimes calls during the days but typically calls in the evenings between 6PM and 9:30PM EST. He will call you from a 757 area code. Only about 10% of those calls are answered because of call screening.\n
He returns thousands of phone calls each year. If you are unable to answer when he calls and you do not return his call, he will move on to the next phone call. Because virtually every human in the USA has caller ID, he doesn&apos;t bother leaving voicemails.  If you get a call from a 757 589-XXXX number in the evening, it is likely him.  He may try to call you again on a different day according to your requested schedule or he may email you.  If he tries to contact you three times without answer or return call he will delete the submission and move on.\n 
We appreciate your patience and look forward to speaking with you about your desired project. We strive to provide only the best in customer service but please keep in mind, we are a small crew and our ability to answer phones is limited to availability of personnel.\n" ;
"Sincerely,\n";
"The FantomWorks Team\n";

    $to = "$email";//<== update the email address
    $headers = "From: $email_from \r\n";
    $headers .= "Reply-To: $email_replyto \r\n";
//Send the email!
    mail($to,$email_subject,$email_body,$headers);
}


if ($flag_inserted && ($datacheck != '')) 
{

	echo "<br /><br /><br /><br /><center><h1>Thank you for submitting your project to FantomWorks! Your project has been added successfully.</h1></center>";
} 
else 
	{
	echo "<br /><br /><br /><br /><center><h1>Your project was NOT submitted successfully. Please call (757)216-1745 or email webmaster@fantomworks.com and we will help you get it sorted out! Please contact us before attempting to reenter your project submission</h1></center>";
	
	    
	}  

    
exit();
?>
