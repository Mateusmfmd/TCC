<?php
require_once 'config.php'; require_once 'helpers.php';
$m=$_SERVER['REQUEST_METHOD'];
if($m==='GET'){$u=exigirSessao($conn,$_GET['token']??'');if(empty($_GET['crianca_id']))erro('crianca_id é obrigatório');exigirCriancaDoUsuario($conn,(int)$_GET['crianca_id'],$u['id_usuario']);$id=(int)$_GET['crianca_id'];$lim=max(1,min(500,(int)($_GET['limite']??50)));$r=$conn->query("SELECT id_historico,texto,emoji,tipo,data_uso FROM historico_comunicacao WHERE crianca_id=$id ORDER BY data_uso DESC LIMIT $lim");$a=[];while($x=$r->fetch_assoc())$a[]=$x;responder(['success'=>true,'historico'=>$a]);}
$d=corpoJson();if(empty($d['crianca_id'])||empty($d['texto']))erro('crianca_id e texto são obrigatórios');if(!empty($d['device_secret']))exigirDispositivoPareado($conn,$d['device_secret']);else{$u=exigirSessao($conn,$d['token']??'');exigirCriancaDoUsuario($conn,(int)$d['crianca_id'],$u['id_usuario']);}
if($m==='POST'){$id=(int)$d['crianca_id'];$fala=isset($d['id_fala'])?(int)$d['id_fala']:null;$emoji=$d['emoji']??'💬';$tipo=$d['tipo']??'fala';$st=$conn->prepare("INSERT INTO historico_comunicacao (crianca_id,id_fala,texto,emoji,tipo) VALUES (?,?,?,?,?)");$st->bind_param("iisss",$id,$fala,$d['texto'],$emoji,$tipo);$st->execute();responder(['success'=>true]);}
if($m==='DELETE'){if(empty($d['device_secret'])){$u=exigirSessao($conn,$d['token']??'');exigirCriancaDoUsuario($conn,(int)$d['crianca_id'],$u['id_usuario']);}$id=(int)$d['crianca_id'];$conn->query("DELETE FROM historico_comunicacao WHERE crianca_id=$id");responder(['success'=>true]);}
erro('Método não permitido',405);
