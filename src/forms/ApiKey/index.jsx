import React, { useState } from 'react'
import { Message, Input } from 'semantic-ui-react'

export default function ApiKey({ apiKey }) {
  const [isCopied, setIsCopied] = useState(false)

  async function copyTextToClipboard(text) {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text)
    } else {
      return navigator.clipboard.writeText(text)
    }
  }

  const handleCopyToClipboard = async () => {
    copyTextToClipboard(apiKey)
      .then(() => {
        setIsCopied(true)

        setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch((err) => {
        console.error({ err })
      })
  }

  return (
    <>
      {isCopied && (
        <Message positive header="Ключ API скопирован в буфер обмена" />
      )}

      <Input
        action={{
          icon: 'copy',
          onClick: handleCopyToClipboard,
        }}
        defaultValue={apiKey}
        fluid
        readOnly
      />
    </>
  )
}
