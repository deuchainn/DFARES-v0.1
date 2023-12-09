import { LocationId } from '@dfares/types';
import React, { useCallback } from 'react';
import { BroadcastPane, BroadcastPaneHelpContent } from '../Panes/BroadcastPane';
import { BuyArtifactPane } from '../Panes/BuyArtifactPane';
import { DropBombPane } from '../Panes/DropBombPane';
import { HatPane } from '../Panes/HatPane';
import {
  ManagePlanetArtifactsHelpContent,
  ManagePlanetArtifactsPane,
  PlanetInfoHelpContent,
} from '../Panes/ManagePlanetArtifacts/ManagePlanetArtifactsPane';
import { PinkPane } from '../Panes/PinkPane';
import { PlanetInfoPane } from '../Panes/PlanetInfoPane';
import { UpgradeDetailsPane, UpgradeDetailsPaneHelpContent } from '../Panes/UpgradeDetailsPane';
import {
  TOGGLE_BROADCAST_PANE,
  TOGGLE_BUY_ARTIFACT_PANE,
  TOGGLE_DROP_BOMB_PANE,
  TOGGLE_HAT_PANE,
  TOGGLE_PINK_PANE,
  TOGGLE_PLANET_ARTIFACTS_PANE,
  TOGGLE_PLANET_INFO_PANE,
  TOGGLE_UPGRADES_PANE,
} from '../Utils/ShortcutConstants';
import { ModalHandle } from '../Views/ModalPane';
import { MaybeShortcutButton } from './MaybeShortcutButton';

export function OpenPaneButton({
  modal,
  title,
  element,
  helpContent,
  shortcut,
}: {
  modal: ModalHandle;
  title: string;
  element: () => React.ReactElement;
  helpContent?: React.ReactElement;
  shortcut?: string;
}) {
  const open = useCallback(() => {
    modal.push({
      title,
      element,
      helpContent,
    });
  }, [title, element, helpContent, modal]);

  return (
    <MaybeShortcutButton
      size='stretch'
      onClick={open}
      onShortcutPressed={open}
      shortcutKey={shortcut}
      shortcutText={shortcut}
    >
      {title}
    </MaybeShortcutButton>
  );
}

export function OpenHatPaneButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Hat'
      shortcut={TOGGLE_HAT_PANE}
      element={() => <HatPane modal={modal} initialPlanetId={planetId} />}
    />
  );
}

export function OpenBuyArtifactPaneButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Buy Artifact'
      shortcut={TOGGLE_BUY_ARTIFACT_PANE}
      element={() => <BuyArtifactPane modal={modal} initialPlanetId={planetId} />}
    />
  );
}

export function OpenBroadcastPaneButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Broadcast'
      shortcut={TOGGLE_BROADCAST_PANE}
      element={() => <BroadcastPane modal={modal} initialPlanetId={planetId} />}
      helpContent={BroadcastPaneHelpContent()}
    />
  );
}

export function OpenUpgradeDetailsPaneButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Upgrade'
      shortcut={TOGGLE_UPGRADES_PANE}
      element={() => <UpgradeDetailsPane modal={modal} initialPlanetId={planetId} />}
      helpContent={UpgradeDetailsPaneHelpContent()}
    />
  );
}
export function OpenManagePlanetArtifactsButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Inventory'
      shortcut={TOGGLE_PLANET_ARTIFACTS_PANE}
      element={() => <ManagePlanetArtifactsPane modal={modal} initialPlanetId={planetId} />}
      helpContent={ManagePlanetArtifactsHelpContent()}
    />
  );
}

export function OpenPlanetInfoButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Info/Claim'
      shortcut={TOGGLE_PLANET_INFO_PANE}
      element={() => <PlanetInfoPane initialPlanetId={planetId} modal={modal} />}
      helpContent={PlanetInfoHelpContent()}
    />
  );
}

export function OpenDropBombButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Drop Bomb'
      shortcut={TOGGLE_DROP_BOMB_PANE}
      element={() => <DropBombPane initialPlanetId={planetId} modal={modal} />}
      helpContent={PlanetInfoHelpContent()}
    />
  );
}

export function OpenPinkButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  return (
    <OpenPaneButton
      modal={modal}
      title='Pink'
      shortcut={TOGGLE_PINK_PANE}
      element={() => <PinkPane initialPlanetId={planetId} modal={modal} />}
      helpContent={PlanetInfoHelpContent()}
    />
  );
}
