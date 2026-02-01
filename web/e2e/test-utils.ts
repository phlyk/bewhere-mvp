/**
 * E2E Test Utilities for BeWhere
 *
 * Shared helpers and page objects for Playwright tests.
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for the map to be fully loaded and interactive
 */
export async function waitForMapLoad(page: Page, timeout = 30000): Promise<void> {
  // Wait for mapbox canvas to be visible
  await expect(page.locator('.mapboxgl-map')).toBeVisible({ timeout });
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible({ timeout });

  // Wait for initial rendering
  await page.waitForTimeout(1000);
}

/**
 * Wait for API connection to be established
 */
export async function waitForApiConnection(page: Page): Promise<void> {
  // Wait for the API status chip to show "ok" or success state
  await expect(
    page.getByText('ok').or(page.locator('.MuiChip-colorSuccess'))
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Select a département from the dropdown
 */
export async function selectDepartement(
  page: Page,
  searchText: string
): Promise<void> {
  const selector = page.getByLabel('Département');
  await selector.click();
  await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5000 });

  // Type to filter if needed
  await selector.fill(searchText);
  await page.waitForTimeout(300);

  // Click the matching option
  const option = page.getByRole('option', { name: new RegExp(searchText, 'i') });
  if (await option.isVisible()) {
    await option.click();
  } else {
    // Select first option if exact match not found
    await page.getByRole('option').first().click();
  }
}

/**
 * Select a crime category from the dropdown
 */
export async function selectCrimeCategory(
  page: Page,
  categoryName?: string
): Promise<void> {
  const selector = page.getByLabel('Crime Category');
  await selector.click();
  await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5000 });

  if (categoryName) {
    const option = page.getByRole('option', { name: new RegExp(categoryName, 'i') });
    if (await option.isVisible()) {
      await option.click();
      return;
    }
  }

  // Select first available option
  await page.getByRole('option').first().click();
}

/**
 * Switch to compare view mode
 */
export async function switchToCompareMode(page: Page): Promise<void> {
  const compareButton = page.getByRole('button', { name: /Compare/i });
  await compareButton.click();
  await page.waitForTimeout(300);
}

/**
 * Switch to map view mode
 */
export async function switchToMapMode(page: Page): Promise<void> {
  const mapButton = page.getByRole('button', { name: /Map/i });
  await mapButton.click();
  await page.waitForTimeout(300);
}

/**
 * Set display mode to count
 */
export async function setDisplayModeCount(page: Page): Promise<void> {
  const countToggle = page.getByRole('button', { name: /Count/i }).first();
  if (await countToggle.isVisible()) {
    await countToggle.click();
    await page.waitForTimeout(200);
  }
}

/**
 * Set display mode to rate per 100k
 */
export async function setDisplayModeRate(page: Page): Promise<void> {
  const rateToggle = page.getByRole('button', { name: /Rate/i }).first();
  if (await rateToggle.isVisible()) {
    await rateToggle.click();
    await page.waitForTimeout(200);
  }
}

/**
 * Get the current number of selected départements
 */
export async function getSelectedCount(page: Page): Promise<number> {
  const countText = page.getByText(/(\d+) département/i);
  if (await countText.isVisible()) {
    const text = await countText.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  return 0;
}

/**
 * Check if the map legend is visible
 */
export async function isLegendVisible(page: Page): Promise<boolean> {
  const legend = page.locator('[class*="Legend"]');
  return legend.isVisible();
}

/**
 * Page object for the sidebar controls
 */
export class SidebarControls {
  constructor(private page: Page) {}

  get departementSelector() {
    return this.page.getByLabel('Département');
  }

  get crimeCategorySelector() {
    return this.page.getByLabel('Crime Category');
  }

  get yearRangeSelector() {
    return this.page.getByText('Year Range');
  }

  get dataSourceSelector() {
    return this.page.getByLabel('Data Source');
  }

  get displayModeToggle() {
    return this.page.getByText('Display Mode');
  }

  get compareButton() {
    return this.page.getByRole('button', { name: /Compare/i });
  }

  get mapButton() {
    return this.page.getByRole('button', { name: /Map/i });
  }
}
