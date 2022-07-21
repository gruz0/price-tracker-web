import { Message, Icon } from 'semantic-ui-react'

export default function JustOneSecond({ title }) {
  return (
    <Message icon>
      <Icon name="circle notched" loading />
      <Message.Content>
        <Message.Header>Одну секунду...</Message.Header>
        {title || 'Мы загружаем необходимые данные.'}
      </Message.Content>
    </Message>
  )
}
