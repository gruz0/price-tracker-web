import React from 'react'
import Link from 'next/link'
import { Container, Icon, Dropdown, Menu } from 'semantic-ui-react'
import ClientOnly from './ClientOnly'
import { useAuth } from '../hooks'
import { useRouter } from 'next/router'

const MenuComponent = () => {
  const router = useRouter()

  return (
    <Menu style={{ marginTop: '10px' }} size="large">
      <Menu.Item active={router.pathname == '/'}>
        <Link href="/">
          <a>
            <Icon name="home" />
          </a>
        </Link>
      </Menu.Item>

      <ClientOnly>
        <AuthDetails />
      </ClientOnly>
    </Menu>
  )
}

function AuthDetails() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return <Menu.Item disabled>Загрузка...</Menu.Item>
  }

  if (!user) {
    return (
      <Container>
        <Menu.Menu position="right">
          <Menu.Item active={router.pathname == '/sign_up'}>
            <Link href="/sign_up" passHref>
              <a>Регистрация</a>
            </Link>
          </Menu.Item>
          <Menu.Item active={router.pathname == '/sign_in'}>
            <Link href="/sign_in" passHref>
              <a>Вход</a>
            </Link>
          </Menu.Item>
        </Menu.Menu>
      </Container>
    )
  }

  return (
    <Container>
      <Menu.Item active={router.pathname == '/products'}>
        <Link href="/products">
          <a>Товары</a>
        </Link>
      </Menu.Item>

      <Menu.Menu position="right">
        <Menu.Item icon>
          <a
            href="https://t.me/chartik_ru"
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть канал в Telegram"
          >
            <Icon name="telegram" size="large" />
          </a>
        </Menu.Item>

        <Dropdown item text="Аккаунт">
          <Dropdown.Menu>
            <Link href="/settings" passHref>
              <Dropdown.Item icon="user" text="Настройки" />
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => logout()}
              icon="sign-out"
              text="Выход"
            />
          </Dropdown.Menu>
        </Dropdown>
      </Menu.Menu>
    </Container>
  )
}

export default MenuComponent
