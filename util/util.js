class Formatter {
  static configToGame(content) {
    return content.replaceAll("&", "§")
  }

  static gameToQQ(str) {
    return str.replace(/§[0-9a-z]|&[0-9a-z]/gi, '');
  }
}

class BetterQQ {
  static sendGroupTextMessage(groupId, message) {
    const json = [{
      "type": "text",
      "data": {
        "text": message
      }
    }];
    qq.sendGroupMessage(groupId, JSON.stringify(json))
  }

  static parseTextJsonMessage(stringJsonMessage) {
    const jsonArray = JSON.parse(stringJsonMessage)
    let newMessage = ""
    for (const item of jsonArray) {
      if (item.type === "text") {
        newMessage += item.data.text
      } else {
        return undefined
      }
    }
    return newMessage
  }

  static parseJsonMessage(stringJsonMessage) {
    const jsonArray = JSON.parse(stringJsonMessage)
    let newMessage = ""
    for (const item of jsonArray) {
      if (item.type === "text") {
        newMessage += item.data.text
      } else if (item.type === "image") {
        newMessage += "[图片]"
      } else if (item.type === "at") {
        if (item.data.qq === "all") {
          newMessage += "@全体成员"
        } else {
          newMessage += `@${item.data.qq}`
        }
      } else {
        newMessage += "[未知消息]"
      }
    }
    return newMessage
  }

  // for
  static addNoForward(messageId) {
    if (scriptManager.hasJsMethod("addGroupNoForward")) {
      scriptManager.callJsMethod("addGroupNoForward", [messageId])
    }
  }
}

class BetterGame {
  static dynamicGetPlayer(name) {
    if (plugin.getOfflinePlayer(name).isOnline()) {
      return plugin.getOnlinePlayer(name)
    } else {
      return plugin.getOfflinePlayer(name)
    }
  }
}