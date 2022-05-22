import { postWithToken } from './fetcher'

export async function changeUserPassword(
  token,
  { current_password, new_password, new_password_confirmation }
) {
  return await postWithToken('/api/v1/settings/change_password', token, {
    current_password,
    new_password,
    new_password_confirmation,
  })
}
