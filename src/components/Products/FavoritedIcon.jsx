import { Icon } from 'semantic-ui-react'

export default function FavoritedIcon({ favorited }) {
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
