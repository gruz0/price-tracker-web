import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Segment,
  Container,
  Divider,
  Button,
  Icon,
  Header,
  List,
} from 'semantic-ui-react'
import LandingLayout from '../components/LandingLayout'

import gamepadIsOutOfStockImage from '../../public/landing/gamepad-is-out-of-stock.png'
import catsFoodImage from '../../public/landing/cats-food.png'
import ozonEmailImage from '../../public/landing/ozon-email.png'
import addNewProductImage from '../../public/landing/add-new-product.png'
import productCardImage from '../../public/landing/product-card.png'
import productSubscriptionImage from '../../public/landing/product-subscription.png'
import productsFilteringImage from '../../public/landing/products-filtering.png'
import productsTableView from '../../public/landing/products-table-view.png'

const HomePage = () => {
  return (
    <>
      <Container textAlign="center" fluid>
        <Header
          as="h1"
          content="GetPrice — Ваш трекер цен"
          style={{
            fontSize: '4em',
            fontWeight: 'normal',
            marginBottom: 0,
            marginTop: '0.7em',
          }}
        />

        <Header
          as="h2"
          content="Узнавайте об изменении цен и наличии любимых товаров быстрее всех!"
          style={{
            fontSize: '1.8em',
            fontWeight: 'normal',
            marginTop: '1.5em',
          }}
        />

        <Divider style={{ marginTop: '3em' }} hidden />

        <Link href="/sign_up" passHref>
          <Button primary size="huge">
            Зарегистрироваться
            <Icon name="right arrow" />
          </Button>
        </Link>
      </Container>

      <Divider style={{ marginTop: '5em' }} />

      <Segment style={{ padding: '5em 0em' }} vertical>
        <Container text>
          <Header as="h3" style={{ fontSize: '2em' }}>
            Зачем всё это нужно?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Никто не хочет переплачивать за товары, цены на которые скачут
            периодически. Бывает очень неприятно, когда ты купил какую-то
            дорогую книгу или подарок любимому человеку, а завтра тебе приходит
            уведомление от магазина на почту, что сегодня скидки.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            <strong>Знакомая ситуация?</strong>
          </p>

          <p style={{ fontSize: '1.33em' }}>
            У нас (Саша и Лиза) больше 500 товаров в хотелках и избранном в
            разных интернет-магазинах и на данный момент нет технической
            возможности следить за актуальностью цен и наличием позиций.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            Вчера корм для животных стоил 8305, а сегодня 8898. Как понять,
            выгодная ли цена сегодня и как сравнить её с ценами за прошлые
            периоды, чтобы вовремя купить и сэкономить денег? Пока никак.
          </p>

          <Image src={catsFoodImage} alt="Цены растут" />

          <Divider hidden />

          <p style={{ fontSize: '1.33em' }}>
            А ещё недавно я (Саша) добавил в избранное Озона геймпад Microsoft
            Xbox Elite Wireless Controller, потому что хочу эту штуку очень
            давно и собирался купить при понижении цены, но не успел…
          </p>

          <p style={{ fontSize: '1.33em' }}>
            <strong>Товар закончился!</strong>
          </p>

          <Image src={gamepadIsOutOfStockImage} alt="Он закончился!" />

          <Divider hidden />

          <p style={{ fontSize: '1.33em' }}>
            Поэтому мы решили сделать этот сервис по отслеживанию цен и
            состоянию наличия товаров в интернет-магазинах –{' '}
            <strong>GetPrice!</strong>
          </p>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Но ведь магазины рассылают письма…
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Да, это очень удобно и спасибо, что такая возможность существует.
          </p>

          <Image src={ozonEmailImage} alt="Письмо из Озон" />

          <Divider style={{ marginTop: '3em' }} hidden />

          <p style={{ fontSize: '1.33em' }}>
            Но личном мне (Саше) не очень нравится видеть письма на товары,
            которые сейчас не очень интересны. Я бы хотел видеть изменения
            только по тем товарам, которые мне действительно нужны.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            <strong>А ещё мы умеем рассылать уведомления в Telegram...</strong>
          </p>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Магазины показывают графики цен
          </Header>

          <p style={{ fontSize: '1.33em' }}>Да, но не все.</p>

          <p style={{ fontSize: '1.33em' }}>
            Сейчас нет никакой возможности сравнить один и тот же товар в двух и
            более магазинах, чтобы понять, где цена ниже и пришло время
            покупать.
          </p>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Какие магазины поддерживаются?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            На этапе бета-тестирования мы сделали поддержку двух популярных
            магазинов: OZON и WILDBERRIES.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            Остальные магазины будут добавляться по мере запросов от
            пользователей и технических возможностей с нашей стороны.
          </p>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Сколько стоит использование сервиса?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            До момента публичного запуска использование
            <strong>GetPrice</strong> абсолютно бесплатно. Дальше будет
            вводиться небольшая ежемесячная плата, чтобы покрыть расходы на
            техническое обеспечение работы продукта.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            Мы очень благодарны всем пользователям, кто поверил в нас на
            начальном этапе и зарегистрировался до даты публичного запуска.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            Все вы получите бесплатный доступ ко всем существующим возможностям
            сервиса и всем новым фичам, которые будут появляться в будущем.
          </p>

          <Link href="/sign_up" passHref>
            <Button as="a" primary size="large">
              Начать пользоваться GetPrice!
              <Icon name="right arrow" />
            </Button>
          </Link>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Когда публичный запуск GetPrice?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Мы планируем завершить бета-тестирование к 1 августа 2022 года.
          </p>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Как это работает изнутри?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Позвольте рассказать простым языком о технических нюансах работы
            <strong>GetPrice</strong>, чтобы вам был понятен механизм работы.
          </p>

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Шаг 1. Вы добавляете ссылки на интересующие вас товары
          </Header>

          <Image src={addNewProductImage} alt="Добавление нового товара" />

          <Divider style={{ marginTop: '3em' }} hidden />

          <p style={{ fontSize: '1.33em' }}>
            На этом этапе мы проверяем товар в нашей базе и если он уже был
            добавлен кем-то до вас, то вы сразу видите все цены и наличие товара
            за всё прошлое время.
          </p>

          <Image src={productCardImage} alt="Карточка товара" />

          <Divider style={{ marginTop: '3em' }} hidden />

          <p style={{ fontSize: '1.33em' }}>
            Если же это новый товар в системе, то мы добавляем его в список на
            обработку и каждые полчаса наши помощники идут по новым товарам и
            собирают необходимую информацию, а потом сохраняют это всё в базу.
          </p>

          <p style={{ fontSize: '1.33em' }}>
            P.S. В данный момент мы работаем над автоматическим импортом товаров
            из ваших списков, чтобы вам не приходилось вручную добавлять десятки
            и сотни товаров.
          </p>

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Шаг 2. Автоматическая проверка цен каждый час
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Периодически помощники обходят все товары в нашей базе и обновляют
            актуальное состояние цены, проверяют наличие скидки и есть ли вообще
            товар, а ещё мы смотрим, не была ли удалена страница в магазине и
            показываем это всё в удобном виде.
          </p>

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Шаг 3. Подписка на события об изменении наличия товара
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            У вас есть возможность подписаться на уведомления в Telegram, если
            нужного вам товара сейчас нет в наличии, но вы хотите узнать от
            бота, когда этот товар появится в магазине и по какой цене.
          </p>

          <Image
            src={productSubscriptionImage}
            alt="Подписка на наличие товара"
          />

          <Divider style={{ marginTop: '3em' }} hidden />

          <p style={{ fontSize: '1.33em' }}>
            Как только товар появится в магазине, наш бот пришлёт вам сообщение
            со ссылкой на магазин и вы прямо из Телеграма сможете перейти в
            магазин и купить нужную вам позицию.
          </p>

          <Link href="/sign_up" passHref>
            <Button as="a" primary size="large">
              Начните следить за скидками!
              <Icon name="right arrow" />
            </Button>
          </Link>

          <Divider style={{ marginTop: '3em' }} hidden />

          <Header as="h3" style={{ fontSize: '2em' }}>
            Вопросы и ответы
          </Header>

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Как искать товары в системе?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Для этого у нас есть удобные фильтры по всем вашим товарам
          </p>

          <Image
            src={productsFilteringImage}
            alt="Фильтры для поиска товаров"
          />

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Какие варианты отображения имеются?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Сейчас мы сделали отображение в виде таблицы и карточек, но хотим
            добавить ещё отображение в виде списка, чтобы каждый выбрал удобный
            для себя способ отображения товаров.
          </p>

          <Image
            src={productsTableView}
            alt="Табличное представление товаров"
          />

          <Header as="h4" style={{ fontSize: '1.3em' }}>
            Что ещё в планах добавить в ближайшее время?
          </Header>

          <p style={{ fontSize: '1.33em' }}>
            Просто списком, а то текста и так очень много :-)
          </p>

          <List>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Связку товаров из разных магазинов в одну карточку
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Группировку товаров (например, товары для домашних питомцев)
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Добавление товаров через бота в Телеграм
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>Отображение картинок товаров</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Добавление товаров в избранное — они всегда будут на виду
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Назначение тегов товарам для удобного поиска
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                Возможность переименовывать товары в удобные вам названия
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="star" />
              <List.Content>
                А ещё оставлять примечания, чтобы не забыть, кто посоветовал
                этот товар
              </List.Content>
            </List.Item>
          </List>

          <p style={{ fontSize: '1.33em' }}>
            Список огромный! Но мы верим, что нам это по силам и готовы это всё
            реализовать с вашей поддержкой.
          </p>

          <Link href="/sign_up" passHref>
            <Button as="a" primary size="large">
              Хорошо. Впустите меня!
              <Icon name="right arrow" />
            </Button>
          </Link>
        </Container>
      </Segment>
    </>
  )
}

HomePage.getLayout = (page) => (
  <LandingLayout
    meta={{
      title: 'Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </LandingLayout>
)

export default HomePage
