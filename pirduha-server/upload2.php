<?php

function upload($upload_url, $filename) {
    $post_params = array('file1' => "@$filename");
    $ch = curl_init($upload_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_params);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    $upload_info = curl_exec($ch);
    curl_close($ch);
    return $upload_info;
}

function download($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    return curl_exec($ch);
}

$image_src = $_REQUEST['img_src'];
$upload_url = $_REQUEST['upload_url'];

$image_data = download($image_src);
$items = explode(".", $image_src);
$ext = strtolower($items[count($items) - 1]);
if ($ext != 'jpeg' && $ext != 'jpg' && $ext != 'png' && $ext != 'gif') {
    echo "{\"error\": \"unsupported extension: $ext\"}";
    exit;
}

$tempname = tempnam('/var/www/pirduha.grigoriev.me/temp', 'file') . "." . $ext;
file_put_contents($tempname, $image_data);

echo upload($upload_url, $tempname);

unlink($tempname);
