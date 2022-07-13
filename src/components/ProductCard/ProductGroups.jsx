import { Menu, Dropdown } from 'semantic-ui-react'

export default function ProductGroups({ groups }) {
  return (
    <Menu.Menu>
      <Dropdown item text="Этот товар находится в группе товаров">
        <Dropdown.Menu>
          {groups.map((group) => {
            return (
              <Dropdown.Item
                key={group.id}
                as="a"
                href={`/products_groups/${group.id}`}
              >
                {group.title}
              </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
  )
}
