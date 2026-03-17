/**
Copyright 2026 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import activityDataReducer, {
  add_error,
  remove_error,
  clear_all_errors,
  clear_errors_by_menu_item,
  toggle_activity_panel,
  open_activity_panel,
  close_activity_panel,
} from '../../../../../Frontend/src/redux/features/activityData';

describe('activityData slice', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns initial state', () => {
    expect(activityDataReducer(undefined, { type: 'unknown' })).toEqual({
      errors: [],
      isPanelOpen: false,
    });
  });

  it('adds error with generated id/time and removes by id', () => {
    const added = activityDataReducer(
      undefined,
      add_error({ menuItem: '/logs', title: 'Load failed', message: 'Boom' })
    );

    expect(added.errors).toHaveLength(1);
    expect(added.errors[0].menuItem).toBe('/logs');
    expect(added.errors[0].title).toBe('Load failed');
    expect(added.errors[0].message).toBe('Boom');
    expect(added.errors[0].id).toContain('/logs_1700000000000_');

    const removed = activityDataReducer(added, remove_error(added.errors[0].id));
    expect(removed.errors).toEqual([]);
  });

  it('clears all errors and clears by menu item', () => {
    const withTwo = activityDataReducer(
      activityDataReducer(
        undefined,
        add_error({ menuItem: '/logs', title: 't1', message: 'm1' })
      ),
      add_error({ menuItem: '/clusters', title: 't2', message: 'm2' })
    );

    const byMenu = activityDataReducer(withTwo, clear_errors_by_menu_item('/logs'));
    expect(byMenu.errors).toHaveLength(1);
    expect(byMenu.errors[0].menuItem).toBe('/clusters');

    const cleared = activityDataReducer(byMenu, clear_all_errors());
    expect(cleared.errors).toEqual([]);
  });

  it('toggles, opens, and closes activity panel', () => {
    const toggled = activityDataReducer(undefined, toggle_activity_panel());
    expect(toggled.isPanelOpen).toBe(true);

    const opened = activityDataReducer(toggled, open_activity_panel());
    expect(opened.isPanelOpen).toBe(true);

    const closed = activityDataReducer(opened, close_activity_panel());
    expect(closed.isPanelOpen).toBe(false);
  });
});
