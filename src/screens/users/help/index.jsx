import React, { useState, useContext } from 'react'
import Image from 'next/image'
import { Divider, Accordion, Icon, Header } from 'semantic-ui-react'

import DisplayContext from '../../../context/display-context'
import { useAuth } from '../../../hooks'
import JustOneSecond from '../../../components/JustOneSecond'

import copyProductLinkFromTheBrowserImage from '../../../../public/images/help/copy-product-link-from-the-browser.png'
import addNewProductToChartikDesktopBrowserImage from '../../../../public/images/help/add-new-product-to-chartik-desktop-browser.png'
import addNewProductToChartikMobileBrowserImage from '../../../../public/images/help/add-new-product-to-chartik-mobile-browser.jpg'
import ozonCopyLinkToProductImage from '../../../../public/images/help/ozon-copy-link-to-product.png'
import wildberriesMobileAppShareIconImage from '../../../../public/images/help/wildberries-mobile-app-01.jpg'
import iPhoneCopyLinkImage from '../../../../public/images/help/iphone-copy-link.jpg'
import productHasBeenAddedImage from '../../../../public/images/help/product-has-been-added.jpg'
import telegramMessageImage from '../../../../public/images/help/telegram-message.jpg'

const Screen = () => {
  const { user } = useAuth()
  const [activeIndex, setActiveIndex] = useState(-1)
  const { isSmallScreen } = useContext(DisplayContext)

  if (!user) {
    return <JustOneSecond />
  }

  const MyDivider = () => (
    <Divider
      style={{ marginTop: isSmallScreen ? '1em' : '3em' }}
      hidden={!isSmallScreen}
    />
  )

  const ClickableImage = ({ src, alt, width, height }) => (
    <div
      style={{
        padding: '1em',
        border: '1px solid #eee',
        width: width,
        height: height,
      }}
    >
      <a href={src.src} target="_blank" rel="noreferrer">
        <Image src={src} alt={alt} width={width} height={height} />
      </a>
    </div>
  )

  const handleClick = (_e, titleProps) => {
    const { index } = titleProps
    const newIndex = activeIndex === index ? -1 : index

    setActiveIndex(newIndex)
  }

  return (
    <>
      <Header as="h2">Помощь по работе с системой</Header>

      <Accordion styled fluid>
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как добавить товар из OZON, WILDBERRIES с компьютера
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 0}>
          <p>
            Чтобы добавить товар в Chartik, необходимо открыть страницу нужного
            вам товара на сайте магазина и скопировать из адресной строки
            браузера ссылку на товар.
          </p>

          <ClickableImage
            src={copyProductLinkFromTheBrowserImage}
            alt="Копируем ссылку на товар"
            width={800}
            height={423}
          />

          <MyDivider />

          <p>
            После этого заходим в Chartik в раздел &quot;Товары&quot; и в
            верхнее текстовое поле вставляете скопированную ссылку и нажимаете
            кнопку &quot;Добавить&quot;
          </p>

          <ClickableImage
            src={addNewProductToChartikDesktopBrowserImage}
            alt="Добавляем ссылку на новый товар"
            width={800}
            height={293}
          />

          <MyDivider />

          <p>
            Если это новый товар в системе, то потребуется время, чтобы собрать
            необходимую информацию по нему, надо просто подождать. Если же
            кто-то из существующих пользователей ранее добавлял этот товар, то
            вы будете сразу перенаправлены на страницу с историей товара.
          </p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 1}
          index={1}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как добавить товар из мобильного приложения OZON
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 1}>
          <p>
            Открываем в мобильном приложении OZON интересующий товар и находим
            кнопку в правом верхнем углу.
          </p>

          <ClickableImage
            src={ozonCopyLinkToProductImage}
            alt="Копируем ссылку на товар"
            width={600}
            height={582}
          />

          <MyDivider />

          <p>
            Теперь надо найти кнопку копирования ссылки в появившемся окне. Если
            нашли — смело нажимайте.
          </p>

          <ClickableImage
            src={iPhoneCopyLinkImage}
            alt="Находим кнопку копирования ссылки на товар"
            width={500}
            height={461}
          />

          <MyDivider />

          <p>
            Заходим через браузер телефона в Chartik и вставляем скопированную
            ссылку на товар.
          </p>

          <ClickableImage
            src={addNewProductToChartikMobileBrowserImage}
            alt="Добавляем ссылку на новый товар"
            width={700}
            height={368}
          />

          <MyDivider />

          <p>Через полчаса товар появится в системе.</p>

          <ClickableImage
            src={productHasBeenAddedImage}
            alt="Товар успешно добавлен"
            width={700}
            height={431}
          />
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 2}
          index={2}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как добавить товар из мобильного приложения WILDBERRIES
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 2}>
          <p>
            Открываем в мобильном приложении WILDBERRIES карточку товара,
            который хотим добавить в Chartik.
          </p>

          <p>
            В правом верхнем углу находим иконку &quot;Поделиться&quot;.
            Нажимаем на неё.
          </p>

          <ClickableImage
            src={wildberriesMobileAppShareIconImage}
            alt="Заходим в интерфейс Поделиться"
            width={400}
            height={598}
          />

          <MyDivider />

          <p>
            В появившемся окне необходимо найти кнопку копирования, обычно она
            называется &quot;Скопировать&quot; или &quot;Copy&quot;.
            <br />
            Если нашли — нажмите её для копирования ссылки на товар.
          </p>

          <ClickableImage
            src={iPhoneCopyLinkImage}
            alt="Находим кнопку копирования ссылки на товар"
            width={500}
            height={461}
          />

          <MyDivider />

          <p>
            Теперь надо зайти в мобильном браузере в Chartik и вставить
            скопированную ссылку. А после нажать на &quot;Добавить&quot;.
          </p>

          <ClickableImage
            src={addNewProductToChartikMobileBrowserImage}
            alt="Добавляем ссылку на новый товар"
            width={700}
            height={368}
          />

          <MyDivider />

          <p>Скоро товар появится в системе.</p>

          <ClickableImage
            src={productHasBeenAddedImage}
            alt="Товар успешно добавлен"
            width={700}
            height={431}
          />
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 3}
          index={3}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Что умеет ваш Telegram бот?
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 3}>
          <p>
            На первом этапе бот будет использоваться для отправки сообщений о
            появлении нужных вам товаров.
            <br />
            Для этого необходимо отправить боту{' '}
            <a
              href={`https://t.me/chartik_ru_bot?start=${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Наш бот в Telegram"
            >
              запрос на добавление
            </a>
            , либо просто нажмите на иконку Telegram в верхнем меню.
          </p>

          <ClickableImage
            src={telegramMessageImage}
            alt="Уведомление в Telegram при появлении товара"
            width={600}
            height={292}
          />

          <Divider hidden />

          <p>
            Дальше в планах добавление товаров напрямую через бота.
            <br />В этом случае не нужно будет копировать ссылки на товар, а
            достаточно просто отправить боту в личку.
          </p>

          <p>
            Ещё, конечно же, хочется через бота отправлять сообщения о снижении
            цены на конкретные (избранные) товары, но это на будущее.
          </p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 4}
          index={4}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как узнать, что товар появился в наличии
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 4}>
          <p>Добавим инструкцию в ближайшее время.</p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 5}
          index={5}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Почему нет данных о ценах на графике
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 5}>
          <p>
            График начинает отображаться более-менее корректно, когда есть
            данные о ценах хотя бы за несколько дней.
            <br />
            Надо просто подождать.
          </p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 6}
          index={6}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как часто обновляются данные в системе
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 6}>
          <p>Новые товары появляются в системе раз в полчаса.</p>

          <p>
            Цены и наличие существующих товаров обновляются несколько раз в день
            небольшими порциями, чтобы не попасть под блокировку магазинов.
          </p>

          <p>
            Сами роботы запускаются с нескольких серверов ежечасно, но
            обрабатывают товары небольшими порциями, поэтому в данный момент нет
            возможности видеть цены за каждый час. Но к этому мы постараемся
            придти.
          </p>

          <p>
            По мере развития сервиса будем докупать больше серверов, чтобы
            равномерно распределять работы между всеми роботами.
          </p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 7}
          index={7}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как добавить все товары из магазина за один раз
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 7}>
          <p>
            Прямо сейчас такой возможности нет, но в данный момент мы работаем
            именно над этой функциональностью, т.к. понимаем, что вбивать
            вручную даже 10 товаров слишком утомительно. Эта функция появится в
            самое ближайшее время. Следите за новостями в{' '}
            <a
              href="https://t.me/chartik_ru"
              target="_blank"
              rel="noreferrer noopener"
            >
              канале Telegram
            </a>
            .
          </p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 8}
          index={8}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как экспортировать список товаров из OZON
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 8}>
          <p>Напишем позже.</p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 9}
          index={9}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как экспортировать список товаров из WILDBERRIES
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 9}>
          <p>Напишем позже.</p>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex === 10}
          index={10}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Как связать товары из двух магазинов в одну карточку
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 10}>
          <p>
            Эта функция на обсуждении и если к ней будет интерес — мы реализуем
            её после внедрения основной функциональности.
          </p>
        </Accordion.Content>
      </Accordion>
    </>
  )
}

export default Screen
