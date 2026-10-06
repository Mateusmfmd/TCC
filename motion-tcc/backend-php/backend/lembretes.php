<?php
require_once 'config.php'; require_once 'helpers.php';
function lembreteUsuario($c,$id,$u){$st=$c->prepare("SELECT l.* FROM lembretes l JOIN criancas cr ON cr.id_crianca=l.crianca_id WHERE l.id_lembrete=? AND cr.usuario_id=?");$st->bind_param("ii",$id,$u);$st->execute();$r=$st->get_result();if(!$r->num_rows)erro('Lembrete não encontrado',403);return$r->fetch_assoc();}
$m=$_SERVER['REQUEST_METHOD'];
if($m==='GET'){if(empty($_GET['crianca_id']))erro('crianca_id é obrigatório');if(!empty($_GET['device_secret']))$cr=exigirDispositivoPareado($conn,$_GET['device_secret']);else{$u=exigirSessao($conn,$_GET['token']??'');$cr=exigirCriancaDoUsuario($conn,(int)$_GET['crianca_id'],$u['id_usuario']);}$id=(int)$cr['id_crianca'];$r=$conn->query("SELECT id_lembrete,texto,feito,hora,recorrencia FROM lembretes WHERE crianca_id=$id ORDER BY hora,id_lembrete DESC");$a=[];while($x=$r->fetch_assoc()){$x['feito']=(bool)$x['feito'];$a[]=$x;}responder(['success'=>true,'lembretes'=>$a]);}
$d=corpoJson();
if($m==='POST'){$u=exigirSessao($conn,$d['token']??'');if(empty($d['crianca_id'])||empty($d['texto']))erro('crianca_id e texto são obrigatórios');exigirCriancaDoUsuario($conn,(int)$d['crianca_id'],$u['id_usuario']);$hora=$d['hora']??null;$rec=$d['recorrencia']??'uma_vez';$st=$conn->prepare("INSERT INTO lembretes (crianca_id,texto,hora,recorrencia) VALUES (?,?,?,?)");$st->bind_param("isss",$d['crianca_id'],$d['texto'],$hora,$rec);$st->execute();responder(['success'=>true,'id_lembrete'=>$conn->insert_id]);}
if(empty($d['id_lembrete']))erro('id_lembrete é obrigatório');$id=(int)$d['id_lembrete'];
if($m==='PUT'){if(!empty($d['device_secret']))exigirDispositivoPareado($conn,$d['device_secret']);else{$u=exigirSessao($conn,$d['token']??'');lembreteUsuario($conn,$id,$u['id_usuario']);}$feito=!empty($d['feito'])?1:0;$conn->query("UPDATE lembretes SET feito=$feito,data_conclusao=".($feito?'NOW()':'NULL')." WHERE id_lembrete=$id");responder(['success'=>true]);}
if($m==='DELETE'){$u=exigirSessao($conn,$d['token']??'');lembreteUsuario($conn,$id,$u['id_usuario']);$conn->query("DELETE FROM lembretes WHERE id_lembrete=$id");responder(['success'=>true]);}
erro('Método não permitido',405);
