import React, { useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Segment,
  Container,
  Divider,
  Button,
  Header,
  List,
} from 'semantic-ui-react'

import priceFeltDownImage from '../../../public/landing/price-felt-down.png'
import productsCardViewImage from '../../../public/landing/products-card-view.png'
import productsTableViewImage from '../../../public/landing/products-table-view.png'

import DisplayContext from '../../context/display-context'

const Screen = () => {
  const { isSmallScreen } = useContext(DisplayContext)

  const MyH3 = ({ children }) => (
    <Header as="h3" style={{ fontSize: isSmallScreen ? '1.5em' : '2em' }}>
      {children}
    </Header>
  )

  const ClickableImage = ({ src, alt, width, height, border }) => (
    <div
      style={{
        padding: isSmallScreen ? '0.2em' : '0.5em',
        width: width,
        height: height,
        border: border,
      }}
    >
      <a href={src.src} target="_blank" rel="noreferrer">
        <Image src={src} alt={alt} layout="responsive" loading="lazy" />
      </a>
    </div>
  )

  const SegmentImage = ({ children }) => (
    <Segment raised secondary>
      {children}
    </Segment>
  )

  const SegmentContent = ({ children }) => (
    <Segment basic style={{ padding: isSmallScreen ? '2em 0em' : '2em 0em' }}>
      <Container text>{children}</Container>
    </Segment>
  )

  return (
    <>
      <Container textAlign="center" fluid>
        <Header
          as="h1"
          style={{
            fontSize: isSmallScreen ? '3.5em' : '5em',
            fontWeight: 'bold',
            marginBottom: 0,
            marginTop: isSmallScreen ? null : '0.7em',
          }}
        >
          Chartik
        </Header>

        <Header
          as="h2"
          content="Следим за наличием и ценами ваших товаров"
          style={{
            fontSize: isSmallScreen ? '1.3em' : '1.8em',
            fontWeight: 'normal',
            marginTop: isSmallScreen ? '0.8em' : '1.3em',
          }}
        />

        <Divider style={{ marginTop: isSmallScreen ? '1em' : '3em' }} hidden />

        <Link href="/sign_up" passHref>
          <Button primary size="huge">
            Зарегистрироваться
          </Button>
        </Link>
      </Container>

      <Divider hidden style={{ marginTop: isSmallScreen ? '2em' : '5em' }} />

      <SegmentImage>
        <ClickableImage
          src={productsCardViewImage}
          alt="Отображение карточек с фотографиями товаров"
        />
      </SegmentImage>

      <Divider style={{ marginTop: isSmallScreen ? '1em' : '3em' }} hidden />

      <SegmentImage>
        <ClickableImage
          src={productsTableViewImage}
          alt="Табличное представление товаров"
        />
      </SegmentImage>

      <Divider style={{ marginTop: isSmallScreen ? '1em' : '3em' }} hidden />

      <SegmentImage>
        <ClickableImage src={priceFeltDownImage} alt="Вместо тысячи слов" />
      </SegmentImage>

      <Divider style={{ marginTop: isSmallScreen ? '1em' : '3em' }} hidden />

      <SegmentContent>
        <MyH3>Что Chartik умеет?</MyH3>

        <List relaxed>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>
              Отслеживать цены и наличие добавленных вами товаров
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>
              Обрабатывать новые товары каждые 5 минут
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>
              Обновлять цены на существующие товары несколько раз в день
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>
              Подгружать фотографии товаров из маркетплейсов
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>
              Уведомлять в Telegram при появлении товара в наличии
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="star" />
            <List.Content>Добавлять новые товары через бота</List.Content>
          </List.Item>
        </List>
      </SegmentContent>

      <SegmentContent>
        <MyH3>Какие магазины поддерживаются?</MyH3>

        <List relaxed>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>ozon.ru</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>lamoda.ru</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>sbermegamarket.ru</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>wildberries.ru</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>goldapple.ru</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="shop" />
            <List.Content>store77.net</List.Content>
          </List.Item>
        </List>
      </SegmentContent>

      <SegmentContent>
        <MyH3>Вам здесь понравится, если вы:</MyH3>

        <List relaxed>
          <List.Item>
            <List.Icon name="heart" />
            <List.Content>Любите сохранять товары в Избранном</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="heart" />
            <List.Content>
              Готовы ждать лучшую цену и время для покупки
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="heart" />
            <List.Content>
              Регулярно покупаете одни и те же товары (например, корм животным)
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="heart" />
            <List.Content>
              Следите за конкретным товаром, чтобы успеть купить по выгодной
              цене
            </List.Content>
          </List.Item>
        </List>
      </SegmentContent>

      <SegmentContent>
        <MyH3>Чего точно не будет в Chartik?</MyH3>

        <List relaxed>
          <List.Item>
            <List.Icon name="dont" />
            <List.Content>
              Мы не делаем мега-поисковик по товарам всего интернета
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="dont" />
            <List.Content>
              Поиска по товарам в интернете, которых нет в нашей системе
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="dont" />
            <List.Content>
              Синхронизации с вашей корзиной в маркетплейсах
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="dont" />
            <List.Content>
              Мы не обрабатываем товары, которые помечены в маркетплейсах как 18+
            </List.Content>
          </List.Item>
        </List>
      </SegmentContent>

      <Container textAlign="center" fluid>
        <Link href="/sign_up" passHref>
          <Button primary size="huge">
            Зарегистрироваться
          </Button>
        </Link>
      </Container>
    </>
  )
}

export default Screen
