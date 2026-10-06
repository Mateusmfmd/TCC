<?php
require_once 'config.php'; require_once 'helpers.php';
$d=corpoJson(); if(!$d)$d=$_POST;
exigirSessao($conn,$d['token']??'');
if(empty($d['id_botao'])||!isset($d['nome_audio']))erro('Dados incompletos');
$id=(int)$d['id_botao'];$st=$conn->prepare("UPDATE configuracao_botoes SET nome_audio=? WHERE id_botao=?");$st->bind_param("si",$d['nome_audio'],$id);if(!$st->execute())erro('Erro ao salvar',500);responder(['success'=>true]);
