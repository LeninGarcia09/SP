import { test, expect, type Page } from '@playwright/test';

/**
 * Wait for the dev-login auto-auth to complete.
 * The app shows "Authenticating..." until the JWT is obtained.
 */
async function waitForAuth(page: Page) {
  await page.waitForFunction(() => {
    return !document.body.textContent?.includes('Authenticat');
  }, { timeout: 15_000 });
}

// Force English locale before every test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
  });
});

// ─── Auth & Layout ──────────────────────────────────────────

test.describe('Auth & Layout', () => {
  test('auto-authenticates and shows dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForAuth(page);

    // Should redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard heading visible
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Main nav items (top-level, not inside collapsed groups)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('shows logged-in user info', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Dev login returns a user; the layout should show the name
    await expect(page.getByText('Dev Admin')).toBeVisible();
  });
});

// ─── Dashboard ──────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('displays stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    await expect(page.getByText('Active Projects')).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Inventory Items')).toBeVisible();
  });

  test('loads without errors', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // No error banner should be visible
    await expect(page.getByText('Failed to load dashboard data')).not.toBeVisible();
    // Dashboard heading is present
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

// ─── Projects CRUD ──────────────────────────────────────────

test.describe('Projects', () => {
  test('navigates to projects page via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Projects is inside "Programs" collapsible group — expand it
    await page.getByRole('button', { name: 'Programs' }).click();
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('shows new project button', async ({ page }) => {
    await page.goto('/projects');
    await waitForAuth(page);

    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
  });

  test('opens new project dialog', async ({ page }) => {
    await page.goto('/projects');
    await waitForAuth(page);

    await page.getByRole('button', { name: 'New Project' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('search input is functional', async ({ page }) => {
    await page.goto('/projects');
    await waitForAuth(page);

    const searchInput = page.getByPlaceholder('Search projects');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nonexistent-xyz');
    await page.waitForTimeout(500);
  });
});

// ─── Personnel ──────────────────────────────────────────────

test.describe('Personnel', () => {
  test('navigates to personnel page via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Personnel nav group
    await page.getByRole('button', { name: 'Personnel' }).click();
    await page.getByRole('link', { name: 'Personnel', exact: true }).click();
    await expect(page).toHaveURL(/\/personnel/);
  });
});

// ─── Inventory ──────────────────────────────────────────────

test.describe('Inventory', () => {
  test('navigates to inventory page', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL(/\/inventory/);
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  });
});

// ─── Users ──────────────────────────────────────────────────

test.describe('Users', () => {
  test('navigates to users page', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });
});

// ─── i18n ───────────────────────────────────────────────────

test.describe('Language Toggle', () => {
  test('switches language to Spanish and back', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Starts in English
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Toggle to Spanish — button shows target language "ES"
    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible({ timeout: 3000 });

    // Toggle back to English — button now shows "EN"
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 3000 });
  });
});

// ─── Programs ───────────────────────────────────────────────

test.describe('Programs', () => {
  test('navigates to programs page via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Programs group button, then link inside
    await page.getByRole('button', { name: 'Programs' }).click();
    await page.getByRole('link', { name: 'Programs' }).click();
    await expect(page).toHaveURL(/\/programs/);
  });
});

// ─── Opportunities ──────────────────────────────────────────

test.describe('Opportunities', () => {
  test('navigates to opportunities page via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAuth(page);

    // Sales group, then Opportunities link
    await page.getByRole('button', { name: 'Sales' }).click();
    await page.getByRole('link', { name: 'Opportunities' }).click();
    await expect(page).toHaveURL(/\/opportunities/);
  });
});
