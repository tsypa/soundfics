install:
	@./install.sh

deinstall:
	@./deinstall.sh

reinstall: deinstall install

clean:
	find . -name "*~" -exec rm {} \;
