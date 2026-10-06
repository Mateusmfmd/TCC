<?php
require_once 'config.php'; require_once 'helpers.php';
$m=$_SERVER['REQUEST_METHOD'];
if(empty($_GET['crianca_id'])&&$m==='GET')erro('crianca_id é obrigatório');
if($m==='GET'){if(!empty($_GET['device_secret']))exigirDispositivoPareado($conn,$_GET['device_secret']);else{$u=exigirSessao($conn,$_GET['token']??'');exigirCriancaDoUsuario($conn,(int)$_GET['crianca_id'],$u['id_usuario']);}$id=(int)$_GET['crianca_id'];$r=$conn->query("SELECT id_frase,texto FROM frases_atalho WHERE crianca_id=$id ORDER BY id_frase DESC");$a=[];while($x=$r->fetch_assoc())$a[]=$x;responder(['success'=>true,'frases'=>$a]);}
$d=corpoJson();if(empty($d['id_frase'])&&$m==='DELETE')erro('id_frase é obrigatório');
if($m==='POST'){if(empty($d['crianca_id'])||empty($d['texto']))erro('crianca_id e texto são obrigatórios');if(!empty($d['device_secret']))exigirDispositivoPareado($conn,$d['device_secret']);else{$u=exigirSessao($conn,$d['token']??'');exigirCriancaDoUsuario($conn,(int)$d['crianca_id'],$u['id_usuario']);}$st=$conn->prepare("INSERT INTO frases_atalho (crianca_id,texto) VALUES (?,?)");$st->bind_param("is",$d['crianca_id'],$d['texto']);$st->execute();responder(['success'=>true,'id_frase'=>$conn->insert_id]);}
if($m==='DELETE'){if(!empty($d['device_secret']))exigirDispositivoPareado($conn,$d['device_secret']);else exigirSessao($conn,$d['token']??'');$id=(int)$d['id_frase'];$conn->query("DELETE FROM frases_atalho WHERE id_frase=$id");responder(['success'=>true]);}
erro('Método não permitido',405);
