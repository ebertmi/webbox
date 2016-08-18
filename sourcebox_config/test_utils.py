"""
The MIT License (MIT)
Copyright (c) 2016 https://github.com/gradescope/gradescope-utils

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

"""
Auto-Grading Utils for Python used on trycoding.io
    - Added hint(str) decorator to display an error hint if a specific test fails
    - Added a default score of 1.0 for every test function
    - Added no_output() decorator to surpress the output of the test function
"""

import sys
import time
import json
import re

from unittest import result
from unittest.signals import registerResult

DIFF_OUTPUT_PATTERN_STR = "(\n?Diff is \d+ characters long\. Set self\.maxDiff to None to see it\.)"
DIFF_OUTPUT_PATTERN = re.compile(DIFF_OUTPUT_PATTERN_STR)

class weight(object):
    """Simple decorator to add a __weight__ property to a function
    Usage: @weight(3.0)
    """
    def __init__(self, val):
        self.val = val

    def __call__(self, func):
        func.__weight__ = self.val
        return func

class hint(object):
    """Simple decorator to add a __hint__ property to a function
    Usage: @hint("Check your print function")
    """
    def __init__(self, val):
        self.val = val

    def __call__(self, func):
        func.__hint__ = self.val
        return func

class exclude_output(object):
    """Simple decorator to add a __exclude_output__ property to a function
    Usage: @no_output()
    """
    def __init__(self):
        self.val = True

    def __call__(self, func):
        func.__exclude_output__ = self.val
        return func

class JSONTestResult(result.TestResult):
    """A test result class that can print formatted text results to a stream.

    Used by JSONTestRunner.
    """
    def __init__(self, stream, descriptions, verbosity, results):
        super(JSONTestResult, self).__init__(stream, descriptions, verbosity)
        self.descriptions = descriptions
        self.results = results

    def getDescription(self, test):
        doc_first_line = test.shortDescription()
        if self.descriptions and doc_first_line:
            return doc_first_line
        else:
            return str(test)

    def getWeight(self, test):
        return getattr(getattr(test, test._testMethodName), '__weight__', 1.0)

    def getHint(self, test):
        return getattr(getattr(test, test._testMethodName), '__hint__', None)

    def getExcludeOutput(self, test):
        return getattr(getattr(test, test._testMethodName), '__exclude_output__', False)

    def includeOutput(self, test):
        return self.buffer == True and self.getExcludeOutput(test) == False

    def startTest(self, test):
        super(JSONTestResult, self).startTest(test)

    def getOutput(self):
        if self.buffer:
            out = self._stdout_buffer.getvalue()
            err = self._stderr_buffer.getvalue()
            if err:
                if not out.endswith('\n'):
                    out += '\n'
                out += err

            return out

    def buildResult(self, test, err=None):
        passed = (err == None)

        weight = self.getWeight(test)
        output = self.getOutput()
        hint = self.getHint(test)

        result = {
            "name": self.getDescription(test),
            "score": weight if passed else 0.0,
            "max_score": weight,
            "success": err == None,
            "hint": hint
        }

        # Check the error
        if err:
            if self.includeOutput(test):
                output += "{0}\n".format(err[1])
                output = re.sub(DIFF_OUTPUT_PATTERN, "", output)

        if output and len(output) > 0:
            result["output"] = output
        return result

    def addSuccess(self, test):
        super(JSONTestResult, self).addSuccess(test)
        self.results.append(self.buildResult(test))

    def addError(self, test, err):
        super(JSONTestResult, self).addError(test, err)
        self.results.append(self.buildResult(test, err))

    def addFailure(self, test, err):
        super(JSONTestResult, self).addFailure(test, err)
        self.results.append(self.buildResult(test, err))


class JSONTestRunner(object):
    """A test runner class that displays results in JSON form.
    """
    resultclass = JSONTestResult

    def __init__(self, stream=sys.stdout, descriptions=True, verbosity=1,
                 failfast=False, buffer=True):
        """
        Set buffer to True to include test output in JSON
        """
        self.stream = stream
        self.descriptions = descriptions
        self.verbosity = verbosity
        self.failfast = failfast
        self.buffer = buffer
        self.json_data = {}
        self.json_data["tests"] = []

    def _makeResult(self):
        return self.resultclass(self.stream, self.descriptions, self.verbosity,
                                self.json_data["tests"])

    def run(self, test):
        "Run the given test case or test suite."
        result = self._makeResult()
        registerResult(result)
        result.failfast = self.failfast
        result.buffer = self.buffer
        startTime = time.time()
        startTestRun = getattr(result, 'startTestRun', None)
        if startTestRun is not None:
            startTestRun()
        try:
            test(result)
        finally:
            stopTestRun = getattr(result, 'stopTestRun', None)
            if stopTestRun is not None:
                stopTestRun()
        stopTime = time.time()
        timeTaken = stopTime - startTime

        self.json_data["execution_time"] = format(timeTaken, "0.2f")

        total_score = 0
        max_score = 0
        for test in self.json_data["tests"]:
            total_score += test["score"]
            max_score += test["max_score"]
        self.json_data["score"] = total_score
        self.json_data["max_score"] = max_score

        data = json.dumps(self.json_data, indent=4)
        self.stream.write(data)
        self.stream.write('\n')
        return result