<?php
require_once 'config.php'; require_once 'helpers.php';
exigirSessao($conn,$_POST['token']??'');
if(empty($_FILES['imagem']))erro('Nenhuma imagem enviada');$f=$_FILES['imagem'];if($f['error']!==UPLOAD_ERR_OK)erro('Falha no envio da imagem');
if($f['size']>5*1024*1024)erro('Imagem muito grande (máximo 5 MB)');
$map=['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp'];$ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));if(!isset($map[$ext]))erro('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
$dir=__DIR__.'/uploads/pictogramas';if(!is_dir($dir))mkdir($dir,0755,true);$name=bin2hex(random_bytes(16)).'.'.$ext;$dest=$dir.'/'.$name;if(!move_uploaded_file($f['tmp_name'],$dest))erro('Não foi possível salvar a imagem no servidor');
responder(['success'=>true,'url'=>'uploads/pictogramas/'.$name]);
