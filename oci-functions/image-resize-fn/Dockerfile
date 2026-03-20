FROM fnproject/python:3.12-dev AS build-stage
WORKDIR /function
ADD requirements.txt /function/

RUN microdnf install gcc python3-devel

RUN pip3 install --target /python/  --no-cache --no-cache-dir -r requirements.txt &&\
  rm -fr ~/.cache/pip /tmp* requirements.txt func.yaml Dockerfile .venv &&\
  chmod -R o+r /python
ADD . /function/
RUN rm -fr /function/.pip_cache

FROM fnproject/python:3.12
RUN microdnf install oracle-epel-release-el9 &&\
      microdnf install ImageMagick &&\
      microdnf remove oracle-epel-release-el9 &&\
      microdnf clean all
WORKDIR /function
COPY --from=build-stage /python /python
COPY --from=build-stage /function /function
RUN chmod -R o+r /function
ENV PYTHONPATH=/function:/python
ENTRYPOINT ["/python/bin/fdk", "/function/func.py", "handler"]
