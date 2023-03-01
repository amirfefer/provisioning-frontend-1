import React from 'react';
import RegionSelect from '.';
import userEvent from '@testing-library/user-event';

import { clonedImages, failureCloneStatus, parentImage } from '../../mocks/fixtures/image.fixtures';
import { render, screen } from '../../mocks/utils';
import { imageBuilderURL } from '../../API/helpers';

describe('RegionSelect', () => {
  test('populate image regions', async () => {
    const PARENT_IMAGE_COUNT = 1;
    await mountSelectAndClick();
    const items = await screen.findAllByLabelText('Region item');
    expect(items).toHaveLength(clonedImages.meta.count + PARENT_IMAGE_COUNT);
  });

  test('filter out regions with unsuccessful cloned image', async () => {
    const { server, rest } = window.msw;
    server.use(
      rest.get(imageBuilderURL(`clones/${clonedImages.data[0].id}`), (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(failureCloneStatus));
      })
    );
    await mountSelectAndClick();
    await screen.findByText(clonedImages.data[1].request.region);
    const filteredRegion = screen.queryByText(clonedImages.data[0].request.region);
    expect(filteredRegion).not.toBeInTheDocument();
  });

  test('no clones images', async () => {
    const PARENT_IMAGE_COUNT = 1;
    const { server, rest } = window.msw;

    server.use(
      rest.get(imageBuilderURL(`composes/${parentImage.id}/clones`), (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ data: [] }));
      })
    );
    await mountSelectAndClick();
    const items = await screen.findAllByLabelText('Region item');
    expect(items).toHaveLength(PARENT_IMAGE_COUNT);
  });

  test('filter items', async () => {
    const searchedValue = 'eu';
    const dropdown = await mountSelectAndClick();
    const clearRegionButton = await screen.findByLabelText('clear region');
    await userEvent.click(clearRegionButton);

    await userEvent.type(dropdown, searchedValue);
    const items = await screen.findAllByLabelText('Region item');
    const expectedLength = clonedImages.data.filter((item) => item.request.region.includes(searchedValue)).length;
    expect(items).toHaveLength(expectedLength);
  });
});

const mountSelectAndClick = async () => {
  render(<RegionSelect composeID={parentImage.id} />);
  const selectDropdown = await screen.findByLabelText('Options menu');
  await userEvent.click(selectDropdown);
  return selectDropdown;
};
