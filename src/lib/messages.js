export const UNHANDLED_ERROR = {
  status: 'unhandled_error',
  message: 'Неизвестная ошибка. Отчёт отправлен разработчику.',
}

export const MISSING_AUTHORIZATION_HEADER = {
  status: 'missing_authorization_header',
  message: 'Требуется авторизация для доступа к разделу',
}

export const MISSING_BEARER_KEY = {
  status: 'missing_bearer_key',
  message: 'Отсутствует Bearer в заголовке',
}

export const MISSING_TOKEN = {
  status: 'missing_token',
  message: 'Отсутствует токен',
}

export const MISSING_LOGIN = {
  status: 'missing_login',
  message: 'Не заполнено поле login',
}

export const LOGIN_IS_INVALID = {
  status: 'login_is_invalid',
  message:
    'Логин может содержать только буквы латинского алфавита, цифры, знак подчёркивания и дефис',
}

export const MISSING_PASSWORD = {
  status: 'missing_password',
  message: 'Не заполнено поле password',
}

export const MISSING_CURRENT_PASSWORD = {
  status: 'missing_current_password',
  message: 'Не заполнен текущий пароль',
}

export const MISSING_NEW_PASSWORD = {
  status: 'missing_new_password',
  message: 'Не заполнен новый пароль',
}

export const MISSING_NEW_PASSWORD_CONFIRMATION = {
  status: 'missing_new_password_confirmation',
  message: 'Не заполнено подтверждение нового пароля',
}

export const NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD = {
  status: 'new_password_must_be_different_from_current_password',
  message: 'Новый пароль не должен совпадать с текущим паролем',
}

export const PASSWORDS_DO_NOT_MATCH = {
  status: 'passwords_do_not_match',
  message: 'Новый пароль и подтверждение нового пароля не совпадают',
}

export const CURRENT_PASSWORD_IS_NOT_VALID = {
  status: 'current_password_is_not_valid',
  message: 'Неправильный текущий пароль',
}

export const PASSWORD_IS_TOO_SHORT = {
  status: 'password_is_too_short',
  message: 'Пароль должен быть не меньше 8 символов',
}

export const MISSING_PRODUCT_ID = {
  status: 'missing_product_id',
  message: 'Отсутствует product_id в запросе',
}

export const MISSING_IN_STOCK = {
  status: 'missing_in_stock',
  message: 'Отсутствует in_stock в запросе',
}

export const MISSING_REQUESTED_BY = {
  status: 'missing_requested_by',
  message: 'Отсутствует requested_by в запросе',
}

export const MISSING_URL_HASH = {
  status: 'missing_url_hash',
  message: 'Отсутствует url_hash в запросе',
}

export const MISSING_SHOP = {
  status: 'missing_shop',
  message: 'Отсутствует shop в запросе',
}

export const MISSING_URL = {
  status: 'missing_url',
  message: 'Отсутствует url в запросе',
}

export const MISSING_STATUS = {
  status: 'missing_status',
  message: 'Отсутствует status в запросе',
}

export const INVALID_CREDENTIALS = {
  status: 'invalid_credentials',
  message: 'Неправильный логин или пароль',
}

export const METHOD_NOT_ALLOWED = {
  status: 'method_not_allowed',
  message: 'Method Not Allowed',
}

export const USER_ALREADY_EXISTS = {
  status: 'user_already_exists',
  message: 'Пользователь с таким логином уже существует',
}

export const USER_DOES_NOT_EXIST = {
  status: 'user_does_not_exist',
  message: 'Пользователь не существует',
}

export const PRODUCT_DOES_NOT_EXIST = {
  status: 'product_does_not_exist',
  message: 'Товар не существует',
}

export const UNABLE_TO_GET_CRAWLER_BY_TOKEN = {
  status: 'unable_to_get_crawler_by_token',
  message: 'Не удалось получить краулер по токену',
}

export const CRAWLER_DOES_NOT_EXIST = {
  status: 'crawler_does_not_exist',
  message: 'Краулер не существует',
}

export const UNABLE_TO_ADD_CRAWLER_LOG = {
  status: 'unable_to_add_crawler_log',
  message: 'Не удалось записать событие краулера',
}

export const UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE = {
  status: 'unable_to_get_products_with_outdated_price',
  message: 'Не удалось получить список товаров для обновления цен',
}

export const USER_DOES_NOT_HAVE_PRODUCT = {
  status: 'user_does_not_have_product',
  message: 'Этого товара нет в вашем списке',
}

export const REDIRECT_TO_PRODUCT_PAGE = {
  status: 'redirect_to_product_page',
  message: 'Переадресуем на карточку товара',
}

export const FORBIDDEN = {
  status: 'forbidden',
  message: 'Необходимо войти в систему',
}

export const PRODUCT_ADDED_TO_QUEUE = {
  status: 'product_added_to_queue',
  message:
    'Товара ещё нет в системе, мы добавили его в очередь на обработку. Спасибо!',
}

export const UNABLE_TO_GET_USER_BY_TOKEN = {
  status: 'unable_to_get_user_by_token',
  message: 'Не удалось найти пользователя по токену',
}

export const UNABLE_TO_UPDATE_USER_TOKEN = {
  status: 'unable_to_update_user_token',
  message: 'Не удалось обновить токен пользователя',
}

export const UNABLE_TO_GET_USER_PRODUCT = {
  status: 'unable_to_get_user_product',
  message: 'Не удалось получить товар пользователя',
}

export const UNABLE_TO_GET_USER_PRODUCTS = {
  status: 'unable_to_get_user_products',
  message: 'Не удалось получить список товаров',
}

export const UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES = {
  status: 'unable_to_get_user_products_with_prices',
  message: 'Не удалось получить список товаров с ценами',
}

export const UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE =
  {
    status: 'unable_to_add_product_to_user_right_now_because_of_missing_price',
    message:
      'Нет возможности добавить товар, т.к. у него нет цены на данный момент',
  }

export const UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY = {
  status: 'unable_to_get_product_latest_price_from_history',
  message: 'Не удалось получить актуальную цену товара из истории',
}

export const INVALID_URL = {
  status: 'invalid_url',
  message:
    'Вы ввели некорректную ссылку. ' +
    'Попробуйте скопировать её из браузера или из приложения магазина',
}

export const UNABLE_TO_CLEAN_URL = {
  status: 'unable_to_clean_url',
  message: 'Не удалось очистить ссылку',
}

export const UNABLE_TO_CALCULATE_URL_HASH = {
  status: 'unable_to_calculate_url_hash',
  message: 'Не удалось рассчитать хеш ссылки',
}

export const UNABLE_TO_FIND_USER = {
  status: 'unable_to_find_user',
  message: 'Не удалось найти пользователя',
}

export const UNABLE_TO_FIND_PRODUCT_BY_URL_HASH = {
  status: 'unable_to_find_product_by_url_hash',
  message: 'Не удалось выполнить поиск товара по ссылке',
}

export const UNABLE_TO_CHECK_USER_EXISTENCE = {
  status: 'unable_to_check_user_existence',
  message: 'Не удалось проверить пользователя по логину',
}

export const UNABLE_TO_CREATE_NEW_USER = {
  status: 'unable_to_create_new_user',
  message: 'Не удалось создать нового пользователя',
}

export const UNABLE_TO_UPDATE_USER_PASSWORD_AND_TOKEN = {
  status: 'unable_to_update_user_password_and_token',
  message: 'Не удалось обновить пароль пользователя и токен',
}

export const UNABLE_TO_CREATE_NEW_PRODUCT = {
  status: 'unable_to_create_new_product',
  message: 'Не удалось создать новый товар',
}

export const UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE = {
  status: 'unable_to_add_new_product_to_queue',
  message: 'Не удалось добавить новый товар в очередь',
}

export const UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE = {
  status: 'unable_to_remove_product_from_queue',
  message: 'Не удалось удалить товар из очереди',
}

export const UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION = {
  status: 'unable_to_move_product_from_queue_to_change_location',
  message:
    'Не удалось переместить товар из очереди в список на смену местоположения',
}

export const UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS = {
  status: 'unable_to_get_new_products_requests',
  message: 'Не удалось получить список новых товаров',
}

export const UNABLE_TO_GET_PRODUCT_BY_ID = {
  status: 'unable_to_get_product_by_id',
  message: 'Не удалось найти товар по ID',
}

export const UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER = {
  status: 'unable_to_add_existing_product_to_user',
  message: 'Не удалось добавить существующий товар пользователю',
}

export const UNABLE_TO_GET_PRODUCT_HISTORY = {
  status: 'unable_to_get_product_history',
  message: 'Не удалось получить историю товара',
}

export const UNABLE_TO_ADD_PRODUCT_HISTORY = {
  status: 'unable_to_add_product_history',
  message: 'Не удалось добавить историю товара',
}
