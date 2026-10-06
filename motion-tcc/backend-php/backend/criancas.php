<?php
require_once 'config.php'; require_once 'helpers.php';
$m=$_SERVER['REQUEST_METHOD'];
if($m==='GET'){
 $u=exigirSessao($conn,$_GET['token']??''); $uid=(int)$u['id_usuario'];
 if(isset($_GET['id_crianca'])) responder(['success'=>true,'crianca'=>formatarCrianca(exigirCriancaDoUsuario($conn,(int)$_GET['id_crianca'],$uid))]);
 $r=$conn->query("SELECT * FROM criancas WHERE usuario_id=$uid ORDER BY nome"); $a=[]; while($x=$r->fetch_assoc())$a[]=formatarCrianca($x);
 responder(['success'=>true,'criancas'=>$a]);
}
$data=corpoJson(); $u=exigirSessao($conn,$data['token']??''); $uid=(int)$u['id_usuario'];
if($m==='POST'){
 if(empty($data['nome']))erro('nome é obrigatório'); $avatar=$data['avatar_emoji']??'🧒'; $pin=$data['pin_saida']??'1234';
 $st=$conn->prepare("INSERT INTO criancas (usuario_id,nome,avatar_emoji,pin_saida) VALUES (?,?,?,?)");$st->bind_param("isss",$uid,$data['nome'],$avatar,$pin);
 if(!$st->execute())erro('Erro ao criar criança',500); $id=$conn->insert_id; semearConteudoPadrao($conn,$id); responder(['success'=>true,'id_crianca'=>$id]);
}
if(empty($data['id_crianca']))erro('id_crianca é obrigatório'); exigirCriancaDoUsuario($conn,(int)$data['id_crianca'],$uid); $id=(int)$data['id_crianca'];
if($m==='DELETE'){ $st=$conn->prepare("DELETE FROM criancas WHERE id_crianca=?");$st->bind_param("i",$id);$st->execute();responder(['success'=>true,'message'=>'Perfil removido']);}
if($m==='PUT'){
 $allowed=['nome','avatar_emoji','pin_saida','tamanho_pictograma','tema','voz']; $set=[];$vals=[];$types='';
 foreach($allowed as $k)if(array_key_exists($k,$data)){ $set[]="$k=?";$vals[]=$data[$k];$types.='s';}
 foreach(['velocidade_voz','volume','tempo_resposta','varredura_velocidade'] as $k)if(array_key_exists($k,$data)){$set[]="$k=?";$vals[]=$data[$k];$types.='d';}
 foreach(['alto_contraste','alvos_gigantes','varredura_ativa'] as $k)if(array_key_exists($k,$data)){$set[]="$k=?";$vals[]=$data[$k]?1:0;$types.='i';}
 if(!$set)erro('Nenhum campo para atualizar'); $sql="UPDATE criancas SET ".implode(',',$set)." WHERE id_crianca=?";$vals[]=$id;$types.='i';
 $st=$conn->prepare($sql);$st->bind_param($types,...$vals);$st->execute();responder(['success'=>true,'message'=>'Configurações atualizadas']);
}
erro('Método não permitido',405);
