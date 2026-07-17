<?php
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>

<!DOCTYPE html>
<html lang="en">
<head>
<title>FantomWorks Call Log System</title>

<link rel="stylesheet" href="styles.css" />
<style type="text/css">
table.main td, th {
    border: 1px solid black;
	border-collapse: collapse;
	word-wrap:break-word;
}
table.header td, th{
	border: 0px solid white;
}
html { 
  background: url(https://calls.fantomworks.com/supportingimages/background1.jpg) no-repeat center center fixed; 
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: 60%;
  font-family: Arial, sans-serif;
	font-size: 14px;
  max-height: 100%;
}
.thumbnail{
position: relative;
z-index: 0;
}
.thumbnail:hover{
background-color: transparent;
z-index: 50;
}
.thumbnail span{ /*CSS for enlarged image*/
position: absolute;
background-color: black;
padding: 15px;
left: -900px;
visibility: hidden;
color: black;
text-decoration: none;
}
.thumbnail span img{ /*CSS for enlarged image*/
border-width: 0;
padding: 2px;
}
.thumbnail:hover span{ /*CSS for enlarged image on hover*/
visibility: visible;
top: -400px;
left: -800px; /*position where enlarged image should offset horizontally */
}
</style>

<!--<body bgcolor="#E6E6FA">-->
<body>
<?php
if (isset($_GET["page"])) { $page  = $_GET["page"]; } else { $page=1; };
$db_host = 'localhost';
$db_user = 'fantomwo_calllog';
$db_pwd = 'REDACTED_SEE_exports/legacy-db-credentials.local.txt';
$database = 'fantomwo_call_log';
$table = 'Project_Submissions';
$Hourly = 125;
$mysqli = mysqli_connect($db_host, $db_user, $db_pwd, $database);
if (mysqli_connect_errno()){
    die("Can't connect to database!");
}

$rCount = mysqli_query($mysqli, "SELECT COUNT(*) FROM Project_Submissions WHERE Archived='0' AND Pending='0' AND Deleted='0' AND Confirmed='0' AND Office='0' ");
$dCount = mysqli_fetch_row($rCount);
$SubCnt = $dCount[0];
$amount = 50;
$page_count = ceil($SubCnt / $amount);
$start = ($page - 1) * $amount;
$sql = "SELECT * FROM Project_Submissions WHERE Archived='0' AND Pending='0' AND Deleted='0' AND Confirmed='0' AND Office='0' ";
if ($_GET['sort'] == 'Name')
{
    $sql .= " ORDER BY Last_Name ASC ";
}
elseif ($_GET['sort'] == 'Vehicle')
{
    $sql .= " ORDER BY Year ASC ";	
}
elseif ($_GET['sort'] == 'Received')
{
    $sql .= " ORDER BY Received_Date DESC ";	
}
elseif ($_GET['sort'] == 'Distance')
{
    $sql .= " ORDER BY Distance DESC ";	
}
else
{
    $sql .= " ORDER BY Received_Date DESC, ID DESC ";	
}
    $sql .= " LIMIT $amount OFFSET $start";

$result = mysqli_query($mysqli, $sql);
if (!$result) 
{
    die("Query to show fields from table failed");
}
$num_rows = mysqli_num_rows($result);
echo "
<table class=\"header\" width = \"100%\">
  <tr>
    <th>Step 1</th>
    <th></th>
    <th>Step 2</th>
    <th></th>
    <th>Step 3</th>
    <th></th>
    <th>Step 4</th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
  </tr>
  <tr>
    <td width=\"150px\"><center><a href=\"https://calls.fantomworks.com/index.php\">Call Log</a></center></td>
    <td width=\"50px\"><center><font size=\"6\">&#8594;</font></center></td>
    <td width=\"150px\"><center><a href=\"https://calls.fantomworks.com/pending.php\">Pending</a></center></td>
    <td width=\"50px\"><center><font size=\"6\">&#8594;</font></center></td>
    <td width=\"150px\"><center><a href=\"https://calls.fantomworks.com/confirmed.php\">Active</a></center></td>
    <td width=\"50px\"><center><font size=\"6\">&#8594;</font></center></td>
    <td width=\"150px\"><center><a href=\"https://calls.fantomworks.com/finished.php\">Finished</a></center></td>
    <td></td>
    <td width=\"175px\"><a href=\"https://calls.fantomworks.com/recent.php\">Go to Recently Archived</a></td>
    <td width=\"175px\"><a href=\"https://projects.fantomworks.com/admin.html\">Go to New Record Submit</a></td>
    <td width=\"85px\"><a href=\"https://calls.fantomworks.com/office.php\">Go to Possibles</a></td>
    <td width=\"100px\"><a href=\"https://calls.fantomworks.com/archives.php\">Go to Archives</a></td>
  </tr>
  <tr>
    <td  colspan=\"12\">
		<br />
		<br />
		<form action=\"https://calls.fantomworks.com/functions/master_search.php\" method='post'>
		<input type=\"text\" name=\"search\" placeholder=\"Search here...\"><br />
		<input type='submit' name='formSearch' id='formSearch' value='Master Search' />
		</form>
	</td>
  </tr>
</table>";

//Main Table 
echo "<center><h1>FantomWorks Call Log</h1></center>";
echo "<center>There are currently $SubCnt potential customers.</center><br />";
echo "<center><p>";
for($i=1; $i<=$page_count; $i++) {
    if($i == $page) {
        echo $i ;
    } else {
        echo '<a href="/index-2.php?page='.$i.'">'  .$i.  '</a>';
    }
}
echo '</p></center>';
echo"<center>

	<center>
		<form action=\"https://calls.fantomworks.com/functions/search.php\" method='post'>
		<input type=\"text\" name=\"search\" placeholder=\"Search here...\"><br />
		<input type='submit' name='formSearch' id='formSearch' value='Search' />
		</form>

	</center>
	";

echo "<table class=\"main\" width = \"100%\">
<tr >
<th style='font-size:18px; width:8%;'><a href=\"index.php?sort=Name\">Customer Name</a></th>
<th style='font-size:18px; width:8%;'>Contact Info</th>
<th style='font-size:18px; width:8%;'><a href=\"index.php?sort=Distance\">Address</a></th>
<th style='font-size:18px; width:8%;'><a href=\"index.php?sort=Vehicle\">Vehicle</a></th>
<th style='font-size:18px; width:8%;'>Project Info</th>
<th style='font-size:18px; width:12%;'>Project Description</th>
<th style='font-size:18px; width:8%;'>Contact Attempts</th>
<th style='font-size:18px; width:8%;'>Picture</th>
<th style='font-size:18px; width:8%;'>Notes</th>
<th style='font-size:18px; width:8%;'><a href=\"index.php?sort=Received\">Receive Date</a></th>
<th style='font-size:18px; width:8%;'>By</th>
<th style='font-size:18px; width:8%;'>Func.</th>
</tr>";

$rowID = 1;
while ($row = mysqli_fetch_array($result)) 
{
	$mydate = $row['Received_Date'];
	$receiveddate = strtotime($mydate);
	$onemonthago = strtotime('-1 month');
	$twomonthago = strtotime('-2 month');
	$threemonthago = strtotime('-3 month');

	echo "<tr>";
			if($receiveddate > $onemonthago)//Less than 30 days old
	{
		echo "<td bgcolor=\"#74ED45\" style='font-size:12px; width:8%;'>";//Green
	}
	else if(($receiveddate > $twomonthago) && ($receiveddate < $onemonthago))//30-60 days old
	{
		echo "<td bgcolor=\"#EDED45\" style='font-size:12px; width:8%;'>";//Yellow
	}
	else if(($receiveddate > $threemonthago) && ($receiveddate < $twomonthago))//60-90 days old
	{
		echo "<td bgcolor=\"#D65151\" style='font-size:12px; width:8%;'>";//Red
	}
	else if($receiveddate < $threemonthago)//More than 90 days old
	{
		echo "<td bgcolor=\"#8B1A1A\" style='font-size:12px; width:8%;'>";//Flashing Red
	}
	else 
	{
		echo "<td style='font-size:12px; width:8%;'>";
	}

    echo "
	{$row['First_Name']} {$row['Last_Name']}</td>
    <td id=\"row_{$rowID}\" style='font-size:12px;width:8%;'>
		<center>
			<a href=\"tel:{$row['Phone']}\">{$row['Phone']}</a>
			<br /><br />
			<a href=\"tel:{$row['Alt_Phone']}\">{$row['Alt_Phone']}</a>
			<br /><br />
            Schedule:{$row['CallSchedule']}
            <br /><br />
			<a href=\"mailto:{$row['Email']}?Subject=FantomWorks\" target=\"_top\">{$row['Email']}</a>
		</center>
	</td>";
	
	if(strlen($row['ZipCode']) > 5 || strlen($row['ZipCode']) < 5 )
	{
    echo "<td id=\"customer_{$row['ID']}\" style='font-size:12px;width:8%;'><center>Customer is unknown miles away. <br /><br /><br />{$row['City']} {$row['State_Country']}<br /><br />{$row['Time_Zone']}</center></td>";
	}
	else
	{
    echo "<td id=\"customer_{$row['ID']}\" style='font-size:12px;width:8%;'><center>{$row['Distance']} miles away <br /> <br /> {$row['City']} {$row['State_Country']}, {$row['ZipCode']}<br /><br />{$row['Time_Zone']}</center></td>";
	}
	
    $Budget = number_format((float)$row['Budget']);
	echo "
	<td style='font-size:12px;width:8%;'><center>{$row['Year']} {$row['Make']} {$row['Model']}</center></td>
	<td style='font-size:12px;width:8%;'><center>Budget: $$Budget <br /> Start: {$row['Project_Start']}</center></td>
	<td style='font-size:12px;width:12%;'>";
	
	$sqlD = "SELECT * FROM Project_Desc WHERE ID='{$row['ID']}' ";
	$resultD = mysqli_query($mysqli, $sqlD);
	$rowD = mysqli_fetch_array($resultD);

	echo "
   <table style=\"font-size:12px; border-collapse: collapse; width: 100%; height: 100%;\">
    <tr><td align=\"center\" style=\"width: 100%;\"><b>Vehicle History</b></td></tr>";

if (!empty($row['Project_Description'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">" . nl2br(htmlspecialchars(str_replace(['\r\n', '\n', '\r'], "\n", $row['Project_Description']))) . "</td>
    </tr>";
}


    echo "
    <table style=\"font-size:12px; border-collapse: collapse; width: 100%; height: 100%; margin-top: 1px;\">
        <tr><td align=\"center\" style=\"width: 100%; \"><b>Tasks to Complete</b></td></tr>";

if (!empty($rowD['DisDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">" . nl2br(htmlspecialchars(str_replace(['\r\n', '\n', '\r'], "\n", $rowD['DisDesc']))) . "</td>
    </tr>";
}

if (!empty($rowD['MediaDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['MediaDesc']}</td>
    </tr>";
}

if (!empty($rowD['FabDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['FabDesc']}</td>
    </tr>";
}

if (!empty($rowD['ChassisDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['ChassisDesc']}</td>
    </tr>";
}

if (!empty($rowD['DriveDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['DriveDesc']}</td>
    </tr>";
}

if (!empty($rowD['AssemDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['AssemDesc']}</td>
    </tr>";
}

if (!empty($rowD['TestDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['TestDesc']}</td>
    </tr>";
}

if (!empty($rowD['BodyDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['BodyDesc']}</td>
    </tr>";
}

if (!empty($rowD['PaintDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['PaintDesc']}</td>
    </tr>";
}

if (!empty($rowD['ElecDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['ElecDesc']}</td>
    </tr>";
}

if (!empty($rowD['ExtDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; \" align=\"center\"><b><i>Owner Labor Estimate</i></b></td>
    </tr>
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['ExtDesc']}</td>
    </tr>";
}

if (!empty($rowD['WringDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; \" align=\"center\"><b><i>Owner Part Estimate</i></b></td>
    </tr>
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['WringDesc']}</td>
    </tr>";
}

if (!empty($rowD['IntDesc'])) {
    echo "
    <tr class='hidden'>
        <td style=\"width: 100%; \" align=\"center\"><b><i>Additional Notes</i></b></td>
    </tr>
    <tr class='hidden'>
        <td style=\"width: 100%; padding: 5px;\">{$rowD['IntDesc']}</td>
    </tr>";
}

echo "</table>";
    
	echo "
	</td>
	<td style='font-size:12px;'><center>";
	
	//------------------------------------
	if(empty($row['CallAttemptOne']))
    {
		echo"
		<form action=\"https://calls.fantomworks.com/functions/call_attempt_one.php\" method='post'>
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formCalledOne' id='formCalledOne' value='Called First' style=\"height:30px; width:110px; margin: 0px 0px 0px 0px;\"/>
		</form>";
    }
    else
		{
		echo "{$row['CallAttemptOne']}<br />";
		}
	//echo "</center></td><td style='font-size:12px;'><center>";

	//------------------------------------
	if(empty($row['CallAttemptTwo']))
    {
		echo" 
		<form action=\"https://calls.fantomworks.com/functions/call_attempt_two.php\" method='post'>
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formCalledTwo' id='formCalledTwo' value='Called Second' style=\"height:30px; width:110px\"/>
		</form>";
    }
    else
		{
		echo "{$row['CallAttemptTwo']}<br />";
		}
	//echo "</table></center></td><td style='font-size:12px;'><center>";

	//------------------------------------
	if(empty($row['CallAttemptThree']))
    {
		echo" 
		<form action=\"https://calls.fantomworks.com/functions/call_attempt_three.php\" method='post'>
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formCalledThree' id='formCalledThree' value='Called Third' style=\"height:30px; width:110px\"/>
		</form>";
    }
    else
		{
		echo "{$row['CallAttemptThree']}<br />";
		}
	//echo "</center></td><td style='font-size:12px;'><center>";

	//------------------------------------
	if(empty($row['EmailAttempt']))
    {
    echo" 
		<form action=\"https://calls.fantomworks.com/functions/email_attempt.php\" method='post'>
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formEmailAttempt' id='formEmailAttempt' value='Emailed' style=\"height:30px; width:110px\"/>
		</form>
		{$row['EmailAttempt']}";
    }
    else
		{
		echo "{$row['EmailAttempt']}<br />";
		}

		echo "</center></td>
		<td>
			<center>
				";
						if(!empty($row['ImageName_1']) || !empty($row['ImageName_2']) || !empty($row['ImageName_3']) || !empty($row['ImageName_4']))
						{
							if(empty($row['ImageName_1']))
							{	
							}
							else
								{
								$image1 = $row['ImageName_1'];
								echo "<a class=\"thumbnail\" href=\"https://projects.fantomworks.com/uploads/$image1\" target=\"_blank\"><img src=\"https://projects.fantomworks.com/uploads/$image1\" width=\"50px\" height=\"50px\" border=\"0\" /><span><img src=\"https://projects.fantomworks.com/uploads/$image1\" height=\"500px\"/></span></a>
								<br />";
								}
							if(empty($row['ImageName_2']))
							{	
							}
							else
								{
								echo "<a class=\"thumbnail\" href=\"https://projects.fantomworks.com/uploads/{$row['ImageName_2']}\" target=\"_blank\"><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_2']}\" width=\"50px\" height=\"50px\" border=\"0\" /><span><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_2']}\" height=\"500px\"/></span></a>
								<br />";
								}
							if(empty($row['ImageName_3']))
							{	
							}
							else
								{
								echo "<a class=\"thumbnail\" href=\"https://projects.fantomworks.com/uploads/{$row['ImageName_3']}\" target=\"_blank\"><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_3']}\" width=\"50px\" height=\"50px\" border=\"0\" /><span><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_3']}\" height=\"500px\"/></span></a>
								<br />";
								}
							if(empty($row['ImageName_4']))
							{
							}
							else
								{
								echo "<a class=\"thumbnail\" href=\"https://projects.fantomworks.com/uploads/{$row['ImageName_4']}\" target=\"_blank\"><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_4']}\" width=\"50px\" height=\"50px\" border=\"0\" /><span><img src=\"https://projects.fantomworks.com/uploads/{$row['ImageName_4']}\" height=\"500px\"/></span></a>
								";
								}
						}
						else
						{
						echo"<center>No<br />Pictures<br />Submitted</center>";						
						}
					echo"
			</center>
		</td>";
	

	$notesrowID = $rowID;
	echo"
	<td style='font-size:12px;width:150px;'>{$row['Notes']} <br /><center><br />
		
		<button onclick=\"editNotes('{$row['ID']}','$notesrowID')\">Add Note</button>
		
	<form action=\"https://calls.fantomworks.com/functions/notes.php\" id='notesForm' method='post'>
		<input type='hidden' id='notesID' name='notesID' />
		<input type='hidden' id='notesrowID' name='notesrowID' value='$rowID'/>
		<input type='hidden' id='notes' name='notes' />
		</form>
		

	</center>";
	
	
	if($row['Parts_Policies'] != '' && 
	   $row['Guarantee_Warranty_Policies']!= '' &&
	   $row['Storage_Fees_Policies'] != '' &&
	   $row['Paint_Changes_Everything'] != '' &&
	   $row['Estimate_Terms'] != ''
	   )
	{
	echo"
	<br />
	<br />
	Parts Policies: {$row['Parts_Policies']}<br />
	Guarantee Warranty Policies: {$row['Guarantee_Warranty_Policies']}<br />
	Storage Fees Policies: {$row['Storage_Fees_Policies']}<br />
	Paint Changes Everything: {$row['Paint_Changes_Everything']}<br />
	Estimate Terms: {$row['Estimate_Terms']}
	</td>";
	}
	
	
		if($receiveddate > $onemonthago)//Less than 30 days old
	{
		echo "<td bgcolor=\"#74ED45\" style='font-size:12px;width:75px;'>";//Green
	}
	
	else if(($receiveddate > $twomonthago) && ($receiveddate < $onemonthago))//30-60 days old
	{
		echo "<td bgcolor=\"#EDED45\" style='font-size:12px;width:75px;'>";//Yellow
	}
	else if(($receiveddate > $threemonthago) && ($receiveddate < $twomonthago))//60-90 days old
	{
		echo "<td bgcolor=\"#D65151\" style='font-size:12px;width:75px;'>";//Red
	}
	else if($receiveddate < $threemonthago)//More than 90 days old
	{
		echo "<td bgcolor=\"#8B1A1A\" style='font-size:12px;width:75px;'>";//Flashing Red
	}
	
	else 
	{
		echo "<td style='font-size:12px;width:75px;'>";
	}

	if($row['Original_Date'] == "0000-00-00")
	{
	echo "<center>{$row['Received_Date']}<br />
	
	<form action=\"https://calls.fantomworks.com/functions/bump.php\" method='post' id='formBump' onclick=\"return checkBump()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='hidden' id='Received_Date' name='Received_Date' value='{$row['Received_Date']}' />
		<input type='submit' name='formBump' id='formBump' value='Bump &uarr;' style=\"height:25px; width:80px\"/>
		</form>";
	}
		if($row['Original_Date'] != "0000-00-00")
		{
		echo "<center>{$row['Received_Date']}<br />
	
		<form action=\"https://calls.fantomworks.com/functions/bump.php\" method='post' id='formBump' onclick=\"return checkBump()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='hidden' id='Received_Date' name='Received_Date' value='{$row['Received_Date']}' />
		<input type='submit' name='formBump' id='formBump' value='Bump &uarr;' style=\"height:25px; width:75px\"/>
		</form>
		<br />
		Original Date:
		{$row['Original_Date']}";		
		}

	echo"</center></td>
	<td style='font-size:12px;width:75px;'><center>{$row['Added_By']}</center></td>
	<td style='font-size:12px;width:75px;'><center>
		
		<form action=\"https://calls.fantomworks.com/functions/delete.php\" method='post' id='formDelete' onclick=\"return checkDelete()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formDelete' id='formDelete' value='Delete' style=\"height:25px; width:75px\"/>
		</form>

		<form action=\"https://calls.fantomworks.com/functions/thanks-nothanks.php\" method='post' id='formThanksNoThanks' onclick=\"return checkThanksNoThanks()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formThanksNoThanks' id='formThanksNoThanks' value='Too New' style=\"height:25px; width:75px\"/>
		</form>
		
		<form action=\"https://calls.fantomworks.com/functions/archive.php\" method='post' onclick=\"return checkArchive()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formArchive' id='formArchive' value='Archive' style=\"height:25px; width:75px\"/>
		</form>
		
		<button onclick=\"Office('{$row['ID']}','$rowID')\" style=\"height:25px; width:75px\">Possible?</button>
		<form action=\"https://calls.fantomworks.com/functions/sendtooffice.php\" id='officeForm' name='officeForm' method='post'>
		<input type='hidden' id='officeID' name='officeID' />
		<input type='hidden' id='rowID' name='rowID' />
		<input type='hidden' id='officecontent' name='officecontent' />
		</form>
		
		<form action=\"https://calls.fantomworks.com/functions/email.php\" id='passForm' method='post'>
		<input type='hidden'  name='passID' value='{$row['ID']}'/>
		<input type='hidden' name='rowID' value='$rowID'/>
		<button type=\"submit\"  value=\"Submit\" style=\"height:25px; width:75px\">Pass</button>
		</form>
		
		<form action=\"https://calls.fantomworks.com/functions/generic_email.php\" id='genericemailForm' method='post'>
		<input type='hidden'  name='genericID' value='{$row['ID']}'/>
		<input type='hidden' name='rowID' value='$rowID'/>
		<button type=\"submit\"  value=\"Submit\" style=\"height:25px; width:75px\">Email</button>
		</form>
		
		<form action=\"https://calls.fantomworks.com/functions/pending.php\" method='post' id='formPending' onclick=\"return checkPending()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formPending' id='formPending' value='Pending' style=\"height:25px; width:75px\"/>
		</form>
		
		<form action=\"https://calls.fantomworks.com/functions/confirmed.php\" method='post' id='formConfirmed' onclick=\"return checkConfirmed()\">
		<input type='hidden' id='ID' name='ID' value='{$row['ID']}' />
		<input type='submit' name='formConfirmed' id='formConfirmed' value='Active' style=\"height:25px; width:75px\"/>
		</form>
		
	</center></td>
    </tr>";
	$rowID++;
}
?>
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script type="text/javascript">
// create the back to top button
$('body').prepend('<a href="#" class="back-to-top">Back to Top</a>');

var amountScrolled = 300;

$(window).scroll(function() {
	if ( $(window).scrollTop() > amountScrolled ) {
		$('a.back-to-top').fadeIn('slow');
	} else {
		$('a.back-to-top').fadeOut('slow');
	}
});

$('a.back-to-top, a.simple-back-to-top').click(function() {
	$('html, body').animate({
		scrollTop: 0
	}, 700);
	return false;
});
</script>

<script language="JavaScript" type="text/javascript">
function checkDelete(){
    return confirm('Are you sure you want to delete this record?');
}
</script> 

<script language="JavaScript" type="text/javascript">
function checkArchive(){
    return confirm('Are you sure you want to archive this record?');
}
</script>

<script language="JavaScript" type="text/javascript">
function checkPending(){
    return confirm('Are you sure you want to move this record to pending?');
}
</script>

<script language="JavaScript" type="text/javascript">
function checkBump(){
    return confirm('Are you sure you want to send this customer to the top of the call log?');
}
</script>

<script language="JavaScript" type="text/javascript">
function checkConfirmed(){
    return confirm('Are you sure you want to send this customer to the confirmed category?');
}
</script>

<script language="JavaScript" type="text/javascript">
		function editNotes(ID,notesrowID) 
		{
			var x;
			var ID = ID;
			var rowID = rowID;
			var note = prompt("Customer Note","Write your customer note here...");
			
			if (note != null) {
				document.getElementById("notes").value = note;
				document.getElementById("notesID").value = ID;
				document.getElementById("notesrowID").value = notesrowID;
				document.getElementById("notesForm").submit();
			} 
        else{
           return false;
			}
		}
	</script>
	
	
<script language="JavaScript" type="text/javascript">
		function Office(ID,rowID) 
		{
			var x;
			var ID = ID;
			var rowID = rowID;
			var officecontent = prompt("Opted by","Enter your name...");
			
			if (officecontent != null) {
				document.getElementById("officecontent").value = officecontent;
				document.getElementById("officeID").value = ID;
				document.getElementById("rowID").value = rowID;
				document.getElementById("officeForm").submit();
			} 
        else{
           return false;
			}
		}
	</script>
	
<script language="JavaScript" type="text/javascript">
	function hides(button) {
		if (button.value == 'Show Description') {
			$('.hidden').show();
			button.value = 'Hide Description';
		} else {
			$('.hidden').hide();
			button.value = 'Show Description';
		}
	}
</script>




	


</head>

</body>
</html>

