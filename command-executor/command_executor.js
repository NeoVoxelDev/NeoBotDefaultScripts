generalConfig.addOption("command-execute.enable", true)
generalConfig.addOption("command-execute.allow", ["$ADMIN"])
if (plugin.getPlatform().toLowerCase() === "bukkit") {
  generalConfig.addOption("command-execute.sort", ["NATIVE", "DEDICATED", "MINECRAFT", "BUKKIT"])
} else {
  generalConfig.addOption("command-execute.sort", [])
}
generalConfig.addOption("command-execute.prefix", ["/sudo ", "/执行 "])
generalConfig.addOption("command-execute.format", true)
generalConfig.addOption("command-execute.delay", 2)

let executorName

for (const sort of generalConfig.getStringArray("command-execute.sort")) {
  const executor = plugin.getExecutorByName(sort)
  if (executor === null || executor === undefined) continue
  const result = executor.init()
  if (result) {
    executorName = sort
    break
  }
}

console.log("Loaded command executor: " + executorName)

qq.register("GroupMessageEvent", (event) => {
  const jsonMessage = event.getJsonMessage()
  const newMessage = scriptManager.callJsMethod("util.parseTextJsonMessage", jsonMessage)
  beforeExecute(event, newMessage)
})

function beforeExecute(event, newMessage) {
  if (generalConfig.getBoolean("command-execute.enable")) {
    for (const prefix of generalConfig.getStringArray("command-execute.prefix")) {
      if (newMessage.startsWith(prefix)) {
        const command = newMessage.slice(prefix.length)
        scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
        const allows = generalConfig.getStringArray("command-execute.allow")
        if (allows.includes("$USER") || allows.includes(event.getSenderId())) {
          execute(command, event.getGroupId())
          return;
        }
        qq.getGroupMemberInfo(event.getGroupId(), event.getSenderId(), (memberInfo) => {
          if (memberInfo.getRole().toString().toUpperCase() === "ADMIN" && allows.includes("$ADMIN")) {
            execute(command, event.getGroupId())
          } else if (memberInfo.getRole().toString().toUpperCase() === "OWNER" && (allows.includes("$ADMIN") || allows.include("$OWNER"))) {
            execute(command, event.getGroupId())
          }
        })
      }
    }
  }
}

function execute(command, groupId) {
  try {
    plugin.getScriptScheduler().submit(() => {
      const executor = plugin.getExecutorByName(executorName)
      executor.init()
      executor.execute(command)
      plugin.getScriptScheduler().submitAsync(() => {
        const result = executor.getResult()
        if (generalConfig.getBoolean("command-execute.format")) {
          scriptManager.callJsMethod("util.sendGroupTextMessage",
            groupId, `[NeoBot] 命令执行结果: \n${scriptManager.callJsMethod("util.gameToQQ", result)}`)
        } else {
          scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, `[NeoBot] 命令执行结果: \n${result}`)
        }
      }, generalConfig.getInt("command-execute.delay"))
    })
  } catch (e) {
    scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, `[NeoBot] 执行命令失败: ${e}`)
  }
}

function executeCommands(commands, callback) {
  plugin.getScriptScheduler().submit(() => {
    let completed = 0
    let results = {}
    const total = commands.length

    if (total === 0) {
      callback(results)
      return
    }

    for (const command of commands) {
      const executor = plugin.getExecutorByName(executorName)
      executor.init()
      executor.execute(command)
      plugin.getScriptScheduler().submitAsync(() => {
        results[command] = executor.getResult()
        completed++
        if (completed === total) {
          callback(results)
        }
      }, generalConfig.getInt("command-execute.delay"))
    }
  })
}

scriptManager.addJsMethod("executeCommands", executeCommands)