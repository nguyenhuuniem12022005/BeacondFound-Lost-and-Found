import Icon from '../../../components/Icons';

export const CATEGORY_ICONS = ['wallet', 'phone', 'document', 'key', 'laptop', 'headphone', 'bag', 'pet', 'device', 'other'];

export function CategoryIcon({ name, cls = 'h-5 w-5' }) {
  const icons = {
    wallet: Icon.wallet(cls),
    phone: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    document: Icon.document(cls),
    key: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    laptop: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    headphone: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V12a9 9 0 0118 0v1.5m-18 0A2.25 2.25 0 015.25 11.25h.75a.75.75 0 01.75.75v6a.75.75 0 01-.75.75h-.75A2.25 2.25 0 013 16.5v-3zm18 0a2.25 2.25 0 00-2.25-2.25H18a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h.75A2.25 2.25 0 0021 16.5v-3z" />
      </svg>
    ),
    bag: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
    pet: (
      <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
        <circle cx="6" cy="9" r="2" /><circle cx="10.5" cy="5.5" r="2" /><circle cx="13.5" cy="5.5" r="2" transform="translate(4.5 0)" /><circle cx="18" cy="9" r="2" />
        <path d="M12 10c-2.5 0-5.5 3-5.5 5.5 0 1.7 1.3 2.5 2.6 2.5 1 0 1.9-.5 2.9-.5s1.9.5 2.9.5c1.3 0 2.6-.8 2.6-2.5C17.5 13 14.5 10 12 10z" />
      </svg>
    ),
    device: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
    other: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  };
  return icons[name] || icons.other;
}
