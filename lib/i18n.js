"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const dictionaries = {
  uz: {
    appName: "JARVIS",
    appTagline: "Biznes nazorat markazi",
    nav_overview: "Umumiy",
    nav_marketing: "Marketing",
    nav_sales: "Sotuv",
    nav_telegram: "Telegram",
    nav_admin: "Sozlamalar",
    logout: "Chiqish",
    login_title: "Login",
    login_password: "Parol",
    login_submit: "Kirish",
    login_loading: "Kirilmoqda...",
    login_default_hint: "Boshlang'ich: admin / admin123",
    live: "JONLI",
    overview_title: "Umumiy hisobot",
    overview_subtitle: "Barcha bo'limlar bo'yicha jamlangan ko'rsatkichlar",
    stat_today_leads: "Bugungi leadlar",
    stat_today_sales: "Bugungi sotuvlar",
    stat_target_spend: "Target xarajat",
    stat_smm_audience: "SMM auditoriya",
    sales_managers: "Sotuv menejerlari",
    no_managers: "Hozircha menejer yoki lead yo'q.",
    telegram_users: "Telegram foydalanuvchilari",
    joined_group_suffix: "tadan gruppaga qo'shilgan",
    sales_title: "Sotuv bo'limi",
    sales_subtitle: "Google Sheets orqali kelayotgan leadlar",
    sync_sheet: "Sheetdan yangilash",
    syncing: "Sinxronlanmoqda...",
    marketing_title: "Marketing bo'limi",
    marketing_subtitle: "Target va SMM statistikasi",
    telegram_title: "Telegram bo'limi",
    telegram_subtitle: "Botga qo'shilgan foydalanuvchilar, gruppa a'zoligi va vazifalar",
    admin_title: "Sozlamalar",
    admin_subtitle: "Xodimlar, ruxsatlar va API ulanishlar",
    employees: "Xodimlar",
    api_connections: "API ulanishlar",
    theme_toggle: "Temani almashtirish",
    language: "Til",
    access_denied: "Sizda bu bo'limni ko'rish uchun ruxsat yo'q. Admin bilan bog'laning.",
    permissions_title: "Bo'lim ruxsatlari",
    view: "Ko'rish",
    edit: "Tahrirlash",
    reset_password: "Parolni almashtirish",
  },
  ru: {
    appName: "JARVIS",
    appTagline: "Центр управления бизнесом",
    nav_overview: "Обзор",
    nav_marketing: "Маркетинг",
    nav_sales: "Продажи",
    nav_telegram: "Telegram",
    nav_admin: "Настройки",
    logout: "Выйти",
    login_title: "Логин",
    login_password: "Пароль",
    login_submit: "Войти",
    login_loading: "Вход...",
    login_default_hint: "По умолчанию: admin / admin123",
    live: "ОНЛАЙН",
    overview_title: "Общий отчёт",
    overview_subtitle: "Сводные показатели по всем отделам",
    stat_today_leads: "Лиды сегодня",
    stat_today_sales: "Продажи сегодня",
    stat_target_spend: "Расход на Target",
    stat_smm_audience: "Аудитория SMM",
    sales_managers: "Менеджеры продаж",
    no_managers: "Пока нет менеджеров или лидов.",
    telegram_users: "Пользователи Telegram",
    joined_group_suffix: "присоединились к группе",
    sales_title: "Отдел продаж",
    sales_subtitle: "Лиды, поступающие из Google Sheets",
    sync_sheet: "Обновить из Sheet",
    syncing: "Синхронизация...",
    marketing_title: "Отдел маркетинга",
    marketing_subtitle: "Статистика Target и SMM",
    telegram_title: "Отдел Telegram",
    telegram_subtitle: "Пользователи бота, участие в группе и задачи",
    admin_title: "Настройки",
    admin_subtitle: "Сотрудники, права доступа и API-подключения",
    employees: "Сотрудники",
    api_connections: "API-подключения",
    theme_toggle: "Сменить тему",
    language: "Язык",
    access_denied: "У вас нет доступа к этому разделу. Обратитесь к администратору.",
    permissions_title: "Права доступа",
    view: "Просмотр",
    edit: "Редактирование",
    reset_password: "Сменить пароль",
  },
  en: {
    appName: "JARVIS",
    appTagline: "Business control center",
    nav_overview: "Overview",
    nav_marketing: "Marketing",
    nav_sales: "Sales",
    nav_telegram: "Telegram",
    nav_admin: "Settings",
    logout: "Log out",
    login_title: "Username",
    login_password: "Password",
    login_submit: "Log in",
    login_loading: "Logging in...",
    login_default_hint: "Default: admin / admin123",
    live: "LIVE",
    overview_title: "Overview",
    overview_subtitle: "Combined metrics across all departments",
    stat_today_leads: "Today's leads",
    stat_today_sales: "Today's sales",
    stat_target_spend: "Target spend",
    stat_smm_audience: "SMM audience",
    sales_managers: "Sales managers",
    no_managers: "No managers or leads yet.",
    telegram_users: "Telegram users",
    joined_group_suffix: "joined the group",
    sales_title: "Sales",
    sales_subtitle: "Leads coming in from Google Sheets",
    sync_sheet: "Sync from Sheet",
    syncing: "Syncing...",
    marketing_title: "Marketing",
    marketing_subtitle: "Target and SMM statistics",
    telegram_title: "Telegram",
    telegram_subtitle: "Bot users, group membership and tasks",
    admin_title: "Settings",
    admin_subtitle: "Employees, permissions and API connections",
    employees: "Employees",
    api_connections: "API connections",
    theme_toggle: "Toggle theme",
    language: "Language",
    access_denied: "You don't have access to this section. Contact your admin.",
    permissions_title: "Module permissions",
    view: "View",
    edit: "Edit",
    reset_password: "Reset password",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("uz");

  useEffect(() => {
    const saved = localStorage.getItem("jarvis_lang");
    if (saved && dictionaries[saved]) setLang(saved);
  }, []);

  function changeLang(next) {
    setLang(next);
    localStorage.setItem("jarvis_lang", next);
  }

  function t(key) {
    return dictionaries[lang]?.[key] ?? dictionaries.uz[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
