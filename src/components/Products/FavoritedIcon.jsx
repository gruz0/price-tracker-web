import { Icon } from 'semantic-ui-react'

export const FavoritedIcon = ({ favorited }) => {
  return (
    <>
      {favorited ? (
        <Icon name="star" link float="right" />
      ) : (
        <Icon name="star outline" link float="right" />
      )}
    </>
  )
}
