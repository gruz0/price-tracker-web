import React from 'react'
import { AuthProvider } from '../hooks'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      {Component.requiresAuth && (
        <Head>
          <script
            // If no token is found, redirect immediately
            dangerouslySetInnerHTML={{
              __html: `if(!document.cookie || document.cookie.indexOf('token') === -1)
            {location.replace(
              "/sign_in?next=" + encodeURIComponent(location.pathname + location.search)
            )}`,
            }}
          />
        </Head>
      )}

      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}

export default MyApp
