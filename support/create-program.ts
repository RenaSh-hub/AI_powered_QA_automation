import { expect, type Locator, type Page } from '@playwright/test';
import { trackProgram } from '../fixtures/cleanup.fixture';

const PROGRAMS_POST = /\/api\/programs\/?$/;

export function waitForCreatedProgramId(page: Page): Promise<string> {
  return page
    .waitForResponse(
      (response) => {
        const request = response.request();
        if (request.method() !== 'POST' || response.status() !== 201) {
          return false;
        }
        try {
          return PROGRAMS_POST.test(new URL(response.url()).pathname);
        } catch {
          return false;
        }
      },
      { timeout: 30_000 },
    )
    .then(async (response) => {
      const body = await response.json();
      const id = body?.data?.id;
      if (typeof id !== 'string' || id.length === 0) {
        throw new Error('POST /api/programs did not return data.id');
      }
      trackProgram(id);
      return id;
    });
}

export async function submitCreateAndTrack(page: Page, modal: Locator): Promise<string> {
  const created = waitForCreatedProgramId(page);
  await modal.getByRole('button', { name: 'Create' }).click();
  return created;
}

export async function createProgram(
  page: Page,
  name: string,
  description = '',
): Promise<string> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const modal = page.getByRole('dialog', { name: 'New Program' });
  await modal.getByRole('textbox', { name: 'Program Name' }).fill(name);
  if (description) {
    await modal.getByRole('textbox', { name: 'Description' }).fill(description);
  }
  const id = await submitCreateAndTrack(page, modal);
  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
  return id;
}
