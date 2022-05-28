import React from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { Container, Segment } from 'semantic-ui-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

import 'semantic-ui-css/semantic.min.css'

const yandexMetrika = '88919188'
const googleAnalytics = 'G-FY73JCKE1R'

const LandingLayout = ({ children, meta = {} }) => {
  const { title, description } = meta

  const defaultDescription =
    'Узнавайте об изменении цен и наличии любимых товаров быстрее всех!'

  return (
    <>
      <Head>
        <title>{title || 'Chartik'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description || defaultDescription} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://chartik.ru/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chartik.ru/chartik.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="900" />
        <meta property="og:image:alt" content={`${title} | ${description}`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="chartik.ru" />
        <meta property="twitter:url" content="https://chartik.ru/" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://chartik.ru/chartik.png" />

        <link rel="icon" type="image/png" href="/favicon.png"></link>

        <meta name="yandex-verification" content="e7bca108c76eb418" />
      </Head>

      {process.env.NODE_ENV === 'production' && (
        <>
          <Script id="yandex-metrika" strategy="lazyOnload">
            {`
               (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
               m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
               (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

               ym(${yandexMetrika}, "init", {
                    clickmap:true,
                    trackLinks:true,
                    accurateTrackBounce:true,
                    webvisor:true
               });
            `}
          </Script>

          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics}`}
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalytics}');
            `}
          </Script>
        </>
      )}

      <Container>
        <Header />

        <Segment basic vertical size="large">
          {children}
        </Segment>

        <Footer />
      </Container>
    </>
  )
}

export default LandingLayout
