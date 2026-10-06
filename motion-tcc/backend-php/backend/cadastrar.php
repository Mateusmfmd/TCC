<?php
require_once 'config.php'; require_once 'helpers.php';
$data=corpoJson();
if(empty($data['nome'])||empty($data['email'])||empty($data['senha'])) erro('nome, email e senha são obrigatórios');
$st=$conn->prepare("SELECT id_usuario FROM usuarios WHERE email=? LIMIT 1"); $st->bind_param("s",$data['email']); $st->execute();
if($st->get_result()->num_rows) erro('Já existe uma conta com este e-mail');
$hash=password_hash($data['senha'],PASSWORD_DEFAULT); $dep=$data['nome_dependente']??'';
$st=$conn->prepare("INSERT INTO usuarios (nome,email,senha,nome_dependente) VALUES (?,?,?,?)"); $st->bind_param("ssss",$data['nome'],$data['email'],$hash,$dep);
if(!$st->execute()) erro('Erro ao cadastrar',500);
$id=$conn->insert_id; $token=criarSessao($conn,$id);
responder(['success'=>true,'message'=>'Usuário cadastrado','usuario'=>['id_usuario'=>$id,'nome'=>$data['nome'],'email'=>$data['email']],'token'=>$token]);
