import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'

import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import useProduct from '../../../../hooks/useProduct'
import ProductCard from '../../../../components/ProductCard'
import DisplayContext from '../../../../context/display-context'

const Screen = () => {
  const router = useRouter()
  const { token, logout } = useAuth()
  const { data, isLoading, error } = useProduct(router.query.id, token)
  const { isSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }
  }, [error])

  return (
    <>
      {error ? (
        <ErrorWrapper header="Не удалось загрузить товар" error={error} />
      ) : (
        <>
          {isLoading ? (
            <JustOneSecond />
          ) : (
            <ProductCard
              product={data.product}
              shops={data.shops}
              groups={data.groups}
              isSmallScreen={isSmallScreen}
            />
          )}
        </>
      )}
    </>
  )
}

export default Screen
