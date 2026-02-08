import React, { useState } from 'react';
import { getFileName, formatDuration } from '../utils';
import TestDetails from './TestDetails';
import './SuiteList.css';

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'passed':
            return (
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        case 'failed':
        case 'timedOut':
            return (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            );
        case 'skipped':
            return (
                <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            );

        default:
            return (
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            );
    }
};

const SpecItem = ({ spec, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    const lastResult = spec.tests[0]?.results[spec.tests[0].results.length - 1];
    const status = lastResult?.status || 'skipped';
    const duration = lastResult?.duration || 0;
    const isFailed = status === 'failed' || status === 'timedOut';

    const ChevronRight = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );

    const Clock = () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <div className="spec-item">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`spec-header ${isOpen ? 'spec-header-open' : ''}`}
            >
                <div className="spec-info">
                    <div className={`spec-icon ${isOpen ? 'spec-icon-active' : ''}`}>
                        <StatusIcon status={spec.ok ? 'passed' : status} />
                    </div>
                    <div className="spec-details">
                        <span className={`spec-title ${isFailed ? 'spec-title-failed' : ''}`}>
                            {spec.title}
                        </span>
                        {spec.tags && spec.tags.length > 0 && (
                            <div className="spec-tags">
                                {spec.tags.map(tag => (
                                    <span key={tag} className="spec-tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="spec-actions">
                    <div className={`spec-duration ${duration > 5000 ? 'spec-duration-slow' : ''}`}>
                        <Clock />
                        {formatDuration(duration)}
                    </div>
                    <div className={`spec-chevron ${isOpen ? 'spec-chevron-open' : ''}`}>
                        <ChevronRight />
                    </div>
                </div>
            </div>
            {isOpen && <TestDetails spec={spec} />}
        </div>
    );
};

const SuiteList = ({ suites, filter, searchTerm }) => {
    const FileText = () => (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    const CornerDownRight = () => (
        <svg className="w-2.4 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 5l7 7-7 7" />
        </svg>
    );

    const filteredSuites = suites.map(suite => {
        const matchingSpecs = suite.specs.filter(spec => {
            const matchesSearch = spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                suite.title.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            const lastResult = spec.tests[0]?.results[spec.tests[0].results.length - 1];
            const status = lastResult?.status || 'skipped';

            if (filter === 'all') return true;
            if (filter === 'passed') return spec.ok;
            if (filter === 'failed') return !spec.ok;
            if (filter === 'flaky') return status === 'flaky';
            return true;
        });

        return { ...suite, specs: matchingSpecs };
    }).filter(suite => suite.specs.length > 0);

    if (filteredSuites.length === 0) {
        return (
            <div className="suite-empty">
                <div className="suite-empty-icon">
                    {/* <FileText /> */}
                </div>
                <h3 className="suite-empty-title">No tests match your filter</h3>
                <p className="suite-empty-text">Try changing the status filter or using a different search term.</p>
            </div>
        );
    }

    return (
        <div className="suite-list">
            {filteredSuites.map((suite, suiteIdx) => (
                <div
                    key={suiteIdx}
                    className="suite-card"
                    style={{ animationDelay: `${suiteIdx * 100}ms` }}
                >
                    <div className="suite-header">
                        <div className="suite-header-content">
                            <div className="suite-icon">
                                {/* <FileText /> */}
                            </div>
                            <div>
                                <h3 className="suite-title">
                                    {getFileName(suite.title)}
                                </h3>
                                <div className="suite-subtitle">
                                    <CornerDownRight />
                                    <span>{suite.title}</span>
                                </div>
                            </div>
                        </div>
                        <span className="suite-count">
                            {suite.specs.length} {suite.specs.length === 1 ? 'test' : 'tests'}
                        </span>
                    </div>
                    <div>
                        {suite.specs.map((spec, specIdx) => (
                            <SpecItem key={spec.id} spec={spec} index={specIdx} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SuiteList;
