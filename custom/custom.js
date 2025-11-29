/// <reference path="../neobot.d.ts" />

customOptions = []

class CustomOption {
  constructor(enable, command, chooseAccount, execute, unbindExecute, output, unbindOutput, format) {
    this.enable = enable
    this.command = command
    this.chooseAccount = chooseAccount
    this.execute = execute
    this.unbindExecute = unbindExecute
    this.output = output
    this.unbindOutput = unbindOutput
    this.format = format
  }

  calculateArgs(pattern) {
    const args = {}
    for (const part of pattern.split(" ")) {
      if (part.startsWith("$regex:{") && part.endsWith("}")) {
        const key = part.slice(8, -1)
        args[key] = {
          necessary: true,
          regex: true
        }
        continue
      }
      if (part.startsWith("${") && part.endsWith("}")) {
        const key = part.slice(2, -1);
        if (key.includes("?:")) {
          const paramName = key.split("?:")[0]
          const defaultValue = key.split("?:")[1]
          args[paramName] = {
            necessary: false,
            regex: false,
            defaultValue: defaultValue
          }
          continue
        }
        if (key.endsWith("?")) {
          const paramName = key.slice(0, -1)
          args[paramName] = {
            necessary: false,
            regex: false,
            defaultValue: ""
          }
          continue
        }
        args[key] = {
          necessary: true,
          regex: false
        }
        continue
      }
      args[part] = {
        necessary: true,
        regex: false,
        value: part
      }
    }
    return args
  }

  matchArgs(command, args) {
    const matched = { matched: true }
    const commandParts = command.split(" ")
    let i = 0
    for (const argName in args) {
      if (args[argName].necessary) {
        if (i >= commandParts.length) {
          return { matched: false }
        }
        // 非参数形式 (指令本身内容)
        if (args[argName].value !== undefined) {
          if (args[argName].value !== commandParts[i]) {
            return { matched: false }
          } else {
            i++
            continue
          }
        }
        // Regex 形式
        if (args[argName].regex) {
          if (!new RegExp(argName).test(commandParts[i])) {
            return { matched: false }
          } else {
            matched[argName] = commandParts[i]
            i++
          }
        } else { // 标准参数形式
          matched[argName] = commandParts[i]
          i++
        }
      } else {
        if (i < commandParts.length) {
          matched[argName] = commandParts[i]
          i++
          continue
        }
        matched[argName] = args[argName].defaultValue
      }
    }
    return matched
  }

  matchCommand(userCmd) {
    for (const cmdPattern of this.command) {
      const args = this.calculateArgs(cmdPattern)
      const result = this.matchArgs(userCmd, args)
      if (result["matched"]) {
        return result
      }
    }
    return { matched: false }
  }
}

function parseOutput(origin) {
  let newOutputs = []
  let lastOutput = ""
  for (const output of origin) {
    if (output === "$random") {
      newOutputs.push(lastOutput)
      lastOutput = ""
    } else {
      lastOutput += output
    }
  }
  newOutputs.push(lastOutput)
  return newOutputs
}

if (generalConfig.has("custom")) {
  for (const str of generalConfig.getObject("custom").getKeys()) {
    const config = generalConfig.getObject("custom").getObject(str)
    const enable = config.getBoolean("enable")
    const command = config.getStringArray("command")
    const chooseAccount = config.getInt("choose_account")
    const execute = config.getStringArray("execute")
    const unbindExecute = config.getStringArray("unbind_execute")
    const output = parseOutput(config.getStringArray("output"))
    const unbindOutput = parseOutput(config.getStringArray("unbind_output"))
    const format = config.getBoolean("format")
    customOptions.push(new CustomOption(enable, command, chooseAccount, execute, unbindExecute, output, unbindOutput, format))
  }
}

qq.register("GroupMessageEvent", (event) => {
  const jsonMessage = event.getJsonMessage()
  const newMessage = scriptManager.callJsMethod("util.parseTextJsonMessage", jsonMessage)
  for (const option of customOptions) {
    if (!option.enable) continue
    const result = option.matchCommand(newMessage)
    if (!result["matched"]) {
      continue
    }
    scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
    if (scriptManager.hasJsMethod("queryBinds")) {
      const binds = scriptManager.callJsMethod("queryBinds", event.getSenderId())
      if (binds.length > 0) {
        let player;
        if (binds.length <= option.chooseAccount) {
          player = scriptManager.callJsMethod("util.dynamicGetPlayer", binds[0])
        } else player = scriptManager.callJsMethod("util.dynamicGetPlayer", binds[option.chooseAccount])
        let outputResult = option.output[Math.floor(Math.random() * option.output.length)]
        for (const key in result) {
          outputResult = outputResult.replaceAll("${" + key + "}", result[key])
        }
        if (option.execute.length > 0 && scriptManager.hasJsMethod("executeCommands")) {
          scriptManager.callJsMethod("executeCommands", option.execute, (results) => {
            let i = 0
            for (const command of option.execute) {
              outputResult = outputResult.replaceAll(`$executes[${i}]`, results[command])
            }
            if (option.format) {
              outputResult = scriptManager.callJsMethod("util.gameToQQ", outputResult)
            }
            scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), plugin.parsePlaceholder(outputResult, player))
          })
        } else {
          if (option.format) {
            outputResult = scriptManager.callJsMethod("util.gameToQQ", outputResult)
          }
          scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), plugin.parsePlaceholder(outputResult, player))
        }
      } else {
        let outputResult = option.unbindOutput[Math.floor(Math.random() * option.unbindOutput.length)]
        for (const key in result) {
          outputResult = outputResult.replaceAll("${" + key + "}", result[key])
        }
        if (option.unbindExecute.length > 0 && scriptManager.hasJsMethod("executeCommands")) {
          scriptManager.callJsMethod("executeCommands", option.unbindExecute, (results) => {
            let i = 0
            for (const command of option.unbindExecute) {
              outputResult = outputResult.replaceAll(`$executes[${i}]`, results[command])
            }
            if (option.format) {
              outputResult = scriptManager.callJsMethod("util.gameToQQ", outputResult)
            }
            scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), plugin.parsePlaceholder(outputResult, null))
          })
        } else {
          if (option.format) {
            outputResult = scriptManager.callJsMethod("util.gameToQQ", outputResult)
          }
          scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), plugin.parsePlaceholder(outputResult, null))
        }
      }
    }
  }
})