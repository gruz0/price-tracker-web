import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Input, Modal, Segment, Button, Message } from 'semantic-ui-react'
import { ProductsGroups } from '../../../../components/ProductsGroups'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import useProductsGroups from '../../../../hooks/useProductsGroups'
import { createNewProductsGroup } from '../../../../lib/products_groups'

export const ProductsGroupsScreen = ({ isSmallScreen }) => {
  const router = useRouter()
  const { isLoading: userLoading, isAuthenticated, token } = useAuth()
  const {
    data: productsGroupsResponse,
    isLoading: productsGroupsLoading,
    error: productsGroupsError,
  } = useProductsGroups(token)

  const [newProductsGroupTitle, setNewProductsGroupTitle] = useState('')
  const [openNewProductsGroupDialog, setOpenNewProductsGroupDialog] =
    useState(false)
  const [createProductsGroupError, setCreateProductsGroupError] = useState('')

  const handleCreateProductsGroup = () => {
    setCreateProductsGroupError('')

    if (newProductsGroupTitle.trim() === '') {
      setCreateProductsGroupError('Заполните, пожалуйста, название группы')
      return
    }

    try {
      createNewProductsGroup(token, newProductsGroupTitle.trim())
        .then((result) => {
          router.push(result.location)
          return
        })
        .catch((err) => {
          console.error({ err })
          setCreateProductsGroupError(err)
        })
    } catch (err) {
      console.error({ err })
      setCreateProductsGroupError(err.message)
    }
  }

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
  }

  if (productsGroupsLoading) {
    return <JustOneSecond title="Загружаем группы товаров..." />
  }

  if (productsGroupsError) {
    return (
      <ErrorWrapper
        header="Не удалось загрузить группы товаров"
        error={productsGroupsError}
      />
    )
  }

  const { products_groups: productsGroups } = productsGroupsResponse

  return (
    <>
      <Segment basic textAlign="right">
        <Button primary onClick={() => setOpenNewProductsGroupDialog(true)}>
          Создать группу
        </Button>
      </Segment>

      <Modal
        size="small"
        onClose={() => setOpenNewProductsGroupDialog(false)}
        onOpen={() => setOpenNewProductsGroupDialog(true)}
        open={openNewProductsGroupDialog}
      >
        <Modal.Header>Новая группа товаров</Modal.Header>
        <Modal.Content>
          <p>
            На этом этапе необходимо придумать название группы товаров, которое
            будет отображаться в таблице на этой странице. Например, если вы
            хотите сгруппировать три конкретных корма для животных из разных
            магазинов, то введите здесь название корма.
          </p>

          <p>Добавление товаров в группу будет доступно на следующем экране.</p>

          {createProductsGroupError !== '' && (
            <ErrorWrapper
              header="Не удалось создать новую группу товаров"
              error={createProductsGroupError}
            />
          )}

          <Input
            fluid
            placeholder='Введите название группы товаров, например, "Корм для кота"'
            maxLength={500}
            value={newProductsGroupTitle}
            onChange={(e) => setNewProductsGroupTitle(e.target.value)}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setOpenNewProductsGroupDialog(false)}>
            Закрыть
          </Button>

          <Button
            content="Создать"
            onClick={handleCreateProductsGroup}
            primary
          />
        </Modal.Actions>
      </Modal>

      {productsGroups.length > 0 ? (
        <ProductsGroups
          productsGroups={productsGroups}
          isSmallScreen={isSmallScreen}
        />
      ) : (
        <Message info>
          <Message.Header>
            В данный момент у вас нет добавленных групп товаров для отображения
          </Message.Header>
          <p>Воспользуйтесь кнопкой для создания первой группы товара.</p>
        </Message>
      )}
    </>
  )
}
