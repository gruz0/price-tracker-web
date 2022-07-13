import { Icon } from 'semantic-ui-react'

export const TrueFalseIcon = ({ value }) => {
  return (
    <>
      {value ? (
        <Icon color="green" name="checkmark" size="large" />
      ) : (
        <Icon color="red" name="close" size="large" />
      )}
    </>
  )
}
