/// <reference path="../neobot.d.ts" />

messageConfig.addOption("game-notice.on-server-start", "[NeoBot] 服务器已启动!")
messageConfig.addOption("game-notice.on-server-stop", "[NeoBot] 服务器已关闭!")
messageConfig.addOption("game-notice.on-join", "[NeoBot] ${playerName} 加入了游戏!")
messageConfig.addOption("game-notice.on-quit", "[NeoBot] ${playerName} 退出了游戏!")
messageConfig.addOption("game-notice.on-die", "[NeoBot] ${playerName} 过世了!")

generalConfig.addOption("game-notice.join.enable", true)
generalConfig.addOption("game-notice.quit.enable", true)
generalConfig.addOption("game-notice.die.enable", true)
generalConfig.addOption("game-notice.server-start.enable", true)
generalConfig.addOption("game-notice.server-stop.enable", true)

gameEvent.register("JoinEvent", (event) => {
  if (!generalConfig.getBoolean("game-notice.join.enable")) return
  const message = messageConfig.getString("game-notice.on-join")
    .replaceAll("${playerName}", event.getName())
  const json = [{
    "type": "text",
    "data": {
      "text": message
    }
  }];
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }
})

gameEvent.register("QuitEvent", (event) => {
  if (!generalConfig.getBoolean("game-notice.quit.enable")) return
  const message = messageConfig.getString("game-notice.on-quit")
    .replaceAll("${playerName}", event.getName())
  const json = [{
    "type": "text",
    "data": {
      "text": message
    }
  }];
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }
})

gameEvent.register("DeathEvent", (player, message) => {
  if (!generalConfig.getBoolean("game-notice.die.enable")) return
  const newMessage = messageConfig.getString("game-notice.on-die")
    .replaceAll("${playerName}", player.getName())
    .replaceAll("${message}", message)
  const json = [{
    "type": "text",
    "data": {
      "text": newMessage
    }
  }];
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }
})

gameEvent.register("PluginEnableEvent", () => {
  if (!generalConfig.getBoolean("game-notice.server-start.enable")) return
  const json = [{
    "type": "text",
    "data": {
      "text": messageConfig.getString("game-notice.on-server-start")
    }
  }];
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }
})

gameEvent.register("PluginDisableEvent", () => {
  if (!generalConfig.getBoolean("game-notice.server-stop.enable")) return
  const json = [{
    "type": "text",
    "data": {
      "text": messageConfig.getString("game-notice.on-server-stop")
    }
  }];
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }
})
