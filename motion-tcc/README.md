# M.O.T.I.O.N.

TCC de tecnologia assistiva e comunicação alternativa. O sistema reúne um aplicativo móvel, uma API e botões físicos em Arduino.

```
Arduino (botões / sensores) --serial--> ponte Python --consulta--> MySQL
Aplicativo móvel (Expo) ------HTTP-----> API PHP (Docker) ------> MySQL
```

| Pasta | Conteúdo | Tecnologias |
|---|---|---|
| `app-mobile/` | Aplicativo (modo responsável e modo criança, funciona offline) | React Native, Expo, JavaScript |
| `backend-php/` | API, banco e ponte com o Arduino | PHP, MySQL, Docker, Python |

Os sketches Arduino ficam em repositórios próprios: `arduino-botoes` e `arduino-sensores`.

Cada pasta tem seu próprio README com instruções de execução.

## Autor

Mateus Florido Pena — [GitHub](https://github.com/Mateusmfmd)
