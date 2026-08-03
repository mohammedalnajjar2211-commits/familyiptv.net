<?php
declare(strict_types=1);
$config = require __DIR__ . '/config.php';
session_start();

if (isset($_POST['logout'])) { session_destroy(); header('Location: import.php'); exit; }
if (empty($_SESSION['iptv_admin'])) {
    $error = '';
    if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['password'])) {
        if (hash_equals((string)$config['admin_password'], (string)$_POST['password'])) {
            $_SESSION['iptv_admin']=true; header('Location: import.php'); exit;
        }
        $error='كلمة المرور غير صحيحة.';
    }
    ?>
<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>دخول الاستيراد</title><style>body{margin:0;background:#080808;color:#fff;font-family:Arial;display:grid;place-items:center;min-height:100vh}.box{width:min(390px,90%);background:#111;border:1px solid #333;border-radius:18px;padding:28px}h1{color:#e11;font-size:22px}input,button{width:100%;box-sizing:border-box;padding:13px;margin-top:12px;border-radius:10px;border:1px solid #333;background:#181818;color:#fff}button{background:#c00;border-color:#e33;font-weight:bold;cursor:pointer}.err{color:#f55}</style>
<div class="box"><h1>Family IPTV — الاستيراد</h1><p>أدخل كلمة مرور الإدارة.</p><?php if($error) echo '<p class="err">'.$error.'</p>'; ?><form method="post"><input type="password" name="password" placeholder="كلمة المرور" required autofocus><button>دخول</button></form></div></html>
<?php exit; }

function fetchUrl(string $url, int $timeout): string {
    if (!filter_var($url, FILTER_VALIDATE_URL)) throw new RuntimeException('رابط M3U غير صالح.');
    $p=parse_url($url); if (!in_array(strtolower($p['scheme']??''),['http','https'],true)) throw new RuntimeException('يسمح بروابط HTTP و HTTPS فقط.');
    if (function_exists('curl_init')) {
        $ch=curl_init($url); curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_CONNECTTIMEOUT=>$timeout,CURLOPT_TIMEOUT=>$timeout,CURLOPT_USERAGENT=>'FamilyIPTV-Catalog/1.0']);
        $data=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
        if($data===false || $code>=400) throw new RuntimeException('فشل التحميل: '.($err?:'HTTP '.$code)); return (string)$data;
    }
    $ctx=stream_context_create(['http'=>['timeout'=>$timeout,'header'=>"User-Agent: FamilyIPTV-Catalog/1.0\r\n"],'https'=>['timeout'=>$timeout,'header'=>"User-Agent: FamilyIPTV-Catalog/1.0\r\n"]]);
    $data=@file_get_contents($url,false,$ctx); if($data===false) throw new RuntimeException('فشل تحميل الرابط. فعّل cURL أو allow_url_fopen.'); return $data;
}
function attr(string $line,string $name): string {
    $q=preg_quote($name,'/');
    if(preg_match('/'.$q.'\s*=\s*"([^"]*)"/i',$line,$m)) return trim(html_entity_decode($m[1],ENT_QUOTES,'UTF-8'));
    if(preg_match("/".$q."\s*=\s*'([^']*)'/i",$line,$m)) return trim(html_entity_decode($m[1],ENT_QUOTES,'UTF-8'));
    if(preg_match('/'.$q.'\s*=\s*([^,\s]+)/i',$line,$m)) return trim($m[1]);
    return '';
}
function parseM3u(string $text): array {
    $text=preg_replace("/^\xEF\xBB\xBF/",'',$text); $lines=preg_split('/\R/',$text); $out=[]; $pending=null;
    foreach($lines as $line){$line=trim($line); if($line==='')continue;
        if(stripos($line,'#EXTINF:')===0){
            $name=''; $pos=strrpos($line,','); if($pos!==false)$name=trim(substr($line,$pos+1));
            $name=attr($line,'tvg-name')?:$name?:'قناة بدون اسم';
            $group=attr($line,'group-title')?:'بدون قسم';
            $logo=attr($line,'tvg-logo');
            $pending=['name'=>$name,'logo'=>$logo,'group'=>$group];
        } elseif($pending!==null && $line[0]!=='#') { $out[]=$pending; $pending=null; }
    }
    return $out;
}
$message='';$error='';
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['import'])){
 try{
    $text='';
    if(!empty($_FILES['m3u_file']['tmp_name'])) {
      if((int)$_FILES['m3u_file']['size']>50*1024*1024) throw new RuntimeException('الملف أكبر من 50MB.');
      $text=(string)file_get_contents($_FILES['m3u_file']['tmp_name']);
    } else {
      $url=trim((string)($_POST['m3u_url']??'')) ?: (string)$config['m3u_url'];
      if($url==='') throw new RuntimeException('ضع رابط M3U أو ارفع ملفًا.');
      $text=fetchUrl($url,(int)$config['timeout']);
    }
    $channels=parseM3u($text); if(!$channels) throw new RuntimeException('لم يتم العثور على قنوات. تأكد أن الملف بصيغة M3U.');
    usort($channels,fn($a,$b)=>strcmp($a['group'].$a['name'],$b['group'].$b['name']));
    $json=json_encode($channels,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT);
    if($json===false || file_put_contents($config['output_file'],$json,LOCK_EX)===false) throw new RuntimeException('تعذر حفظ channels.json. تأكد من صلاحيات الكتابة.');
    $message='تم الاستيراد بنجاح: '.count($channels).' قناة.';
 }catch(Throwable $e){$error=$e->getMessage();}
}
?>
<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>استيراد M3U</title><style>body{margin:0;background:#080808;color:#eee;font-family:Arial;padding:25px}.box{max-width:720px;margin:auto;background:#111;border:1px solid #333;border-radius:18px;padding:28px}h1{color:#e11}label{display:block;margin-top:18px}input{width:100%;box-sizing:border-box;padding:13px;margin-top:8px;border-radius:10px;border:1px solid #333;background:#181818;color:#fff}button{padding:13px 20px;margin-top:20px;border-radius:10px;border:1px solid #e33;background:#c00;color:#fff;font-weight:bold;cursor:pointer}.ok{background:#102014;color:#7fda91;padding:12px;border-radius:10px}.err{background:#261010;color:#ff8080;padding:12px;border-radius:10px}.note{color:#999;font-size:13px;line-height:1.8}.logout{float:left;background:#222;border-color:#444;margin-top:0}</style>
<div class="box"><form method="post"><button class="logout" name="logout">تسجيل الخروج</button></form><h1>استيراد قائمة M3U</h1><p class="note">سيتم تنزيل القائمة الآن وتحويل أسماء القنوات وشعارات tvg-logo والأقسام إلى ملف <b>channels.json</b>. لن يُحفظ رابط M3U داخل الصفحة.</p>
<?php if($message)echo '<p class="ok">'.$message.'</p>'; if($error)echo '<p class="err">'.$error.'</p>'; ?>
<form method="post" enctype="multipart/form-data">
<label>رابط M3U (اختياري إذا رفعت ملفًا)<input type="url" name="m3u_url" placeholder="http://myhand.org:8080/get.php?username=20231415019781&password=17005502246422&type=m3u_plus&output=ts"></label>
<label>أو ارفع ملف M3U<input type="file" name="m3u_file" accept=".m3u,.m3u8,.txt"></label>
<button name="import">استيراد وتحديث القنوات</button>
</form><p class="note">بعد نجاح الاستيراد افتح الصفحة الرئيسية. لحماية صفحة الإدارة غيّر كلمة المرور في <code>admin/config.php</code>.</p></div></html>
