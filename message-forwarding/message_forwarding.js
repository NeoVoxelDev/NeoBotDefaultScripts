/// <reference path="../neobot.d.ts" />

generalConfig.addOption("chat-forward.to-game.enable", true)
generalConfig.addOption("chat-forward.to-game.max-length", 200)
generalConfig.addOption("chat-forward.to-game.filter", true)
generalConfig.addOption("chat-forward.to-game.max-replace", "...")
generalConfig.addOption("chat-forward.to-qq.enable", true)
generalConfig.addOption("chat-forward.to-qq.format", true)
generalConfig.addOption("chat-forward.to-qq.filter", true)
generalConfig.addOption("chat-forward.to-qq.max-length", 200)
generalConfig.addOption("chat-forward.to-qq.max-replace", "...")

messageConfig.addOption("chat-forward.to-qq", "[游戏] ${playerName}: ${message}")
messageConfig.addOption("chat-forward.to-game", "&a[QQ群(${groupId})] &b${senderName}: &f${message}")

const groupNotForwards = []

scriptManager.addJsMethod("addGroupNoForward", (messageId) => {
  groupNotForwards.push(messageId)
})

gameEvent.register("ChatEvent", (event) => {
  if (!generalConfig.getBoolean("chat-forward.to-qq.enable")) return
  const name = event.getPlayer().getName()
  let message = event.getMessage()
  if (generalConfig.getBoolean("chat-forward.to-qq.format")) {
    message = scriptManager.callJsMethod("util.gameToQQ", message)
  }
  if (message.length > generalConfig.getInt("chat-forward.to-qq.max-length")) {
    const maxLength = generalConfig.getInt("chat-forward.to-qq.max-length") -
      generalConfig.getString("chat-forward.to-qq.max-replace").length
    message = message.substring(0, maxLength) + generalConfig.getString("chat-forward.to-qq.max-replace")
  }
  let format = messageConfig.getString("chat-forward.to-qq");
  format = format.replaceAll("${playerName}", name)
  format = format.replaceAll("${message}", message)
  if (generalConfig.getBoolean("chat-forward.to-qq.filter")) {
    format = scriptManager.callJsMethod("filter.filterMessage", format)
  }
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, format)
  }
})

qq.register("GroupMessageEvent", (event) => {
  if (!generalConfig.getBoolean("chat-forward.to-game.enable")) return
  if (groupNotForwards.includes(event.getMessageId())) {
    groupNotForwards.splice(groupNotForwards.indexOf(event.getMessageId()), 1)
    return
  }
  for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
    if (groupId === event.getGroupId()) {
      const senderId = event.getSenderId()
      const message = event.getMessage().toString()
      qq.getGroupMemberInfo(groupId, senderId, (info) => {
        let newMessage = scriptManager.callJsMethod("util.parseJsonMessage", message)
        let name = info.getCard()
        if (name === "") {
          name = info.getNickname()
        }
        if (newMessage.length > generalConfig.getInt("chat-forward.to-game.max-length")) {
          const maxLength = generalConfig.getInt("chat-forward.to-game.max-length") -
            generalConfig.getString("chat-forward.to-game.max-replace").length
          newMessage = newMessage.substring(0, maxLength) + generalConfig.getString("chat-forward.to-game.max-replace")
        }
        let format = messageConfig.getString("chat-forward.to-game");
        format = format.replaceAll("${senderName}", name)
        format = format.replaceAll("${groupId}", groupId)
        format = format.replaceAll("${message}", newMessage)
        format = format.replaceAll("${senderId}", senderId)
        if (generalConfig.getBoolean("chat-forward.to-game.filter")) {
          format = scriptManager.callJsMethod("filter.filterMessage", format)
        }
        plugin.broadcast(scriptManager.callJsMethod("util.configToGame", format))
      })
    }
  }
})

