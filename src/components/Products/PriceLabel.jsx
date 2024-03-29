import { Label } from 'semantic-ui-react'

export const PriceLabel = ({ product, attached, ribbon, tag }) => {
  const myBenefit = product.my_benefit
  const myBenefitAbsolute = Math.abs(myBenefit)

  return (
    <>
      {product.has_discount ? (
        <>
          {product.in_stock && (
            <Label
              attached={attached}
              ribbon={ribbon}
              tag={tag}
              color="green"
              title={
                `Товар подешевел на ` +
                myBenefitAbsolute +
                ` р. с момента отслеживания вами этого товара`
              }
            >
              -{myBenefitAbsolute} р.{' '}
            </Label>
          )}
        </>
      ) : (
        <>
          {myBenefit < 0 && (
            <Label
              attached={attached}
              ribbon={ribbon}
              tag={tag}
              color="red"
              title={
                `Товар подорожал на ` +
                myBenefitAbsolute +
                ` р. с момента отслеживания вами этого товара`
              }
            >
              +{myBenefitAbsolute} р.
            </Label>
          )}
        </>
      )}
    </>
  )
}
