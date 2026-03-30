import { Client, TextMessage } from "@line/bot-sdk"

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
}

const client = new Client(config)

export async function sendLineGroupNotification(message: string) {
  const groupId = process.env.LINE_NOTIFY_GROUP_ID

  if (!groupId) {
    throw new Error("LINE_NOTIFY_GROUP_ID is not defined")
  }

  const textMessage: TextMessage = {
    type: "text",
    text: message,
  }

  return client.pushMessage(groupId, textMessage)
}
