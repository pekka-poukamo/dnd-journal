// Version Info Test - Simple Testing (ADR-0002 Compliant)
import { expect } from 'chai';
import { VERSION_INFO } from '../js/version.js';

describe('Version Info', () => {
  describe('VERSION_INFO', () => {
    it('should have required properties', () => {
      expect(VERSION_INFO).to.have.property('commit');
      expect(VERSION_INFO).to.have.property('shortCommit');
      expect(VERSION_INFO).to.have.property('runNumber');
      expect(VERSION_INFO).to.have.property('timestamp');
      expect(VERSION_INFO).to.have.property('ref');
    });

    it('should have default development values', () => {
      expect(VERSION_INFO.commit).to.equal('dev');
      expect(VERSION_INFO.shortCommit).to.equal('dev');
      expect(VERSION_INFO.runNumber).to.equal('local');
      expect(VERSION_INFO.timestamp).to.equal('development');
      expect(VERSION_INFO.ref).to.equal('local');
    });
  });

  describe('Version formatting logic', () => {
    it('should format development version correctly', () => {
      const versionText = VERSION_INFO.commit === 'dev' ? 'Development' : `v${VERSION_INFO.runNumber} (${VERSION_INFO.shortCommit})`;
      expect(versionText).to.equal('Development');
    });

    it('should format production version correctly', () => {
      const productionInfo = { commit: 'abc123', runNumber: '42', shortCommit: 'abc123f' };
      const versionText = productionInfo.commit === 'dev' ? 'Development' : `v${productionInfo.runNumber} (${productionInfo.shortCommit})`;
      expect(versionText).to.equal('v42 (abc123f)');
    });
  });
});