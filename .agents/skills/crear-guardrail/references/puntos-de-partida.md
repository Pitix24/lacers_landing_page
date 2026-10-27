# Puntos de partida — documentación de hooks y permisos

Estos enlaces son **solo un punto de partida**. Los agentes cambian rápido: antes de configurar,
consultar la versión vigente de la documentación oficial. **Si difiere de lo que dice acá, gana la
documentación oficial.**

| Agente | Dónde buscar |
|---|---|
| Claude Code | Hooks: https://code.claude.com/docs/en/hooks · Settings y permisos: https://code.claude.com/docs/en/settings |
| OpenCode | Permisos: https://opencode.ai/docs/permissions/ · Plugins (eventos): https://opencode.ai/docs/plugins/ |
| Codex CLI | Configuración (aprobaciones, sandbox): https://github.com/openai/codex — buscar la sección de configuración en la documentación del repo |
| Antigravity | Buscar en la documentación oficial de Google Antigravity la sección de reglas, permisos o políticas de terminal |
| Otro agente | Buscar en su documentación oficial: "hooks", "permissions", "policies" o "approval" |

## Conceptos que suelen aparecer (con nombres distintos en cada agente)

- **Permisos declarativos:** listas de acciones permitidas, prohibidas o que requieren confirmación.
- **Hooks / eventos:** lógica que se ejecuta antes o después de una acción del agente (por ejemplo,
  antes de ejecutar un comando de terminal o de escribir un archivo).
- **Alcance:** configuración de proyecto (se comparte con el equipo vía repo) vs. de usuario
  (solo en tu máquina).
