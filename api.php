<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username = "root";
$password = "";
$database = "Jossa";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// Only fetch the latest round per year for cleaner analysis (final allotment snapshot)
// But also include round info so JS can compare rounds if needed
$sql = "SELECT year, round, iit, branch, seat_type AS seatType, gender, openingRank, closingRank FROM josaa_data WHERE seat_type = 'OPEN' AND gender = 'Gender-Neutral'";
$result = $conn->query($sql);

$data = array();

if ($result) {
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row["year"] = (int)$row["year"];
            $row["round"] = (int)$row["round"];
            $row["openingRank"] = (int)$row["openingRank"];
            $row["closingRank"] = (int)$row["closingRank"];
            $data[] = $row;
        }
    }
    echo json_encode($data);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error querying data: " . $conn->error]);
}

$conn->close();
?>
