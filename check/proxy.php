<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$logFile = __DIR__ . "/logs.txt";

// لوج أساسي لكل دخول للملف
function writeLog($msg) {
    global $logFile;
    file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
}

// تسجيل الوصول للبروكسي قبل أي معالجة
writeLog("Proxy accessed | Raw Query: " . json_encode($_GET) . " | UA: " . ($_SERVER['HTTP_USER_AGENT'] ?? "Unknown"));

// التحقق من وجود البيانات
if (empty($_GET["user"]) || empty($_GET["pass"])) {
    writeLog("Missing params – STOP");
    echo json_encode(["error" => "Missing params"]);
    exit;
}

$user = urlencode($_GET["user"]);
$pass = urlencode($_GET["pass"]);
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? "Unknown";

$servers = [
    ["protocol" => "http", "host" => "new-pro.tv",        "port" => 8080, "backup" => 8080, "package" => "Family"],
    ["protocol" => "http", "host" => "forever-locals.com","port" => 8080, "backup" => 2095, "package" => "Forever"],
    ["protocol" => "http", "host" => "max.amigo00.com",  "port" => 2052, "backup" => null, "package" => "Adult"],
    ["protocol" => "http", "host" => "amigo00.com",      "port" => 80,   "backup" => null, "package" => "Lite"]
];

$response = null;
$lastError = "";
$usedServer = null;

// دالة الاتصال
function tryServer($protocol, $host, $port, $user, $pass) {
    $url = "$protocol://$host:$port/player_api.php?username=$user&password=$pass";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    $res = curl_exec($ch);
    $err = curl_errno($ch) ? curl_error($ch) : null;
    curl_close($ch);
    return [$res, $err, $url];
}

// محاولة الاتصال
foreach ($servers as $s) {

    list($res, $err, $url) = tryServer($s['protocol'], $s['host'], $s['port'], $user, $pass);
    writeLog("Trying: $url | Error: " . ($err ?: "NONE"));

    if (!$err) {
        $response = $res;
        $usedServer = $s;
        break;
    }

    if ($s['backup']) {
        list($res, $err, $url) = tryServer($s['protocol'], $s['host'], $s['backup'], $user, $pass);
        writeLog("Backup Try: $url | Error: " . ($err ?: "NONE"));
        if (!$err) {
            $response = $res;
            $usedServer = $s;
            break;
        }
    }

    $lastError = $err;
}

// يسجل سواء نجح أو فشل
writeLog("Final Result | User: $user | Pass: $pass | Server: " . ($usedServer['package'] ?? "None") . " | Status: " . ($response ? "SUCCESS" : "FAILED($lastError)"));

// إذا فشل الاتصال
if (!$response) {
    echo json_encode(["error" => "curl_error", "info" => "Failed to connect to any server"]);
    exit;
}

// JSON
$data = json_decode($response, true);
if (!$data) {
    writeLog("Invalid JSON Response");
    echo json_encode(["error" => "Invalid JSON response", "raw" => $response]);
    exit;
}

if ($usedServer) {
    $data['package_name'] = $usedServer['package'];
}

echo json_encode($data);
?>
